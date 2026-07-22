import { prisma } from '../../config/db.js';
import { Prisma } from '@prisma/client';
import type { ISBNLookupResult, GetBooksQuery } from './books.schemas.js';
import { AppError } from '../../utils/AppError.js';
import { sanitizeGoogleBooksUrl } from '../../utils/image.utils.js';
import { AdminService } from '../admin/admin.service.js';

export class BooksService {
  /**
   * Downloads an external book cover image, processes it to WebP using sharp via AdminService,
   * and uploads it to Supabase storage. Returns the new Supabase URL, or the original URL on failure.
   */
  private static async downloadAndProcessCover(coverUrl: string | null | undefined): Promise<string | null> {
    if (!coverUrl || coverUrl.trim() === '') {
      return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      console.log(`[CoverPipeline] Downloading external cover: ${coverUrl}`);
      const response = await fetch(coverUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[CoverPipeline] Failed to download cover. Status: ${response.status}. Falling back to original URL.`);
        return coverUrl;
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log(`[CoverPipeline] Uploading optimized WebP image via AdminService...`);
      const optimizedUrl = await AdminService.uploadImage(buffer);
      console.log(`[CoverPipeline] Image uploaded successfully. Optimized URL: ${optimizedUrl}`);
      return optimizedUrl;
    } catch (error) {
      console.error(`[CoverPipeline] Error processing cover image:`, error);
      return coverUrl; // Graceful Failure fallback
    }
  }

  /**
   * Creates a new book in the database.
   * Validates if the book's ISBN already exists.
   */
  static async createBook(data: any) {
    const existing = await prisma.book.findUnique({
      where: { isbn: data.isbn },
    });
    if (!existing && data.coverUrl) {
      data.coverUrl = await this.downloadAndProcessCover(data.coverUrl);
    }
    if (existing) {
      if (existing.isActive) {
        throw new AppError('El libro con este ISBN ya está registrado', 400);
      }
      return prisma.$transaction(async (tx) => {
        // Reactivate logically deleted book
        const book = await tx.book.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            price: data.price,
            stock: data.stock,
          },
        });

        // Atomically refresh authors relationship
        await tx.bookAuthor.deleteMany({
          where: { bookId: book.id },
        });

        const authorIds: string[] = [];
        if (data.authors && Array.isArray(data.authors)) {
          for (const authorName of data.authors) {
            const author = await tx.author.upsert({
              where: { name: authorName.trim() },
              update: {},
              create: { name: authorName.trim() },
            });
            authorIds.push(author.id);
          }
        }

        for (const authorId of authorIds) {
          await tx.bookAuthor.create({
            data: {
              bookId: book.id,
              authorId,
            },
          });
        }

        const reactivatedBook = await tx.book.findUnique({
          where: { id: book.id },
          include: {
            authors: {
              include: {
                author: true,
              },
            },
          },
        });

        if (!reactivatedBook) {
          throw new AppError('Error al reactivar el libro', 500);
        }

        return {
          ...reactivatedBook,
          authors: reactivatedBook.authors.map((ba) => ba.author),
          reactivated: true,
        };
      });
    }

    return prisma.$transaction(async (tx) => {
      // Find or create authors
      const authorIds: string[] = [];
      if (data.authors && Array.isArray(data.authors)) {
        for (const authorName of data.authors) {
          const author = await tx.author.upsert({
            where: { name: authorName.trim() },
            update: {},
            create: { name: authorName.trim() },
          });
          authorIds.push(author.id);
        }
      }

      // Create book
      const book = await tx.book.create({
        data: {
          isbn: data.isbn,
          title: data.title,
          originalTitle: data.originalTitle || null,
          googleBooksId: data.googleBooksId || null,
          publishedDate: data.publishedDate || null,
          language: data.language || null,
          synopsis: data.synopsis || null,
          coverUrl: data.coverUrl || null,
          price: data.price,
          stock: data.stock,
          badge: data.badge || null,
          genre: data.genre || null,
          isActive: true,
        },
      });

      // Create BookAuthor relations
      for (const authorId of authorIds) {
        await tx.bookAuthor.create({
          data: {
            bookId: book.id,
            authorId: authorId,
          },
        });
      }

      // Fetch completed book with authors relation
      const createdBook = await tx.book.findUnique({
        where: { id: book.id },
        include: {
          authors: {
            include: {
              author: true,
            },
          },
        },
      });

      if (!createdBook) {
        throw new AppError('Error al crear el libro', 500);
      }

      return {
        ...createdBook,
        authors: createdBook.authors.map((ba) => ba.author),
      };
    });
  }

  /**
   * Updates a book in the database.
   * Handles BookAuthor relationship cleaning and reconnecting atlink level.
   */
  static async updateBook(id: string, data: any) {
    const existing = await prisma.book.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new AppError('Libro no encontrado', 404);
    }

    const oldCoverUrl = existing.coverUrl;
    let coverChanged = false;

    if (data.coverUrl !== undefined && data.coverUrl !== oldCoverUrl) {
      coverChanged = true;
      if (data.coverUrl) {
        const isAlreadyInSupabase = data.coverUrl.includes('supabase.co') || 
          (process.env.SUPABASE_URL && data.coverUrl.includes(process.env.SUPABASE_URL));
        if (!isAlreadyInSupabase) {
          data.coverUrl = await this.downloadAndProcessCover(data.coverUrl);
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // If authors is present, update BookAuthor relationships
      if (data.authors && Array.isArray(data.authors)) {
        // Delete existing relations
        await tx.bookAuthor.deleteMany({
          where: { bookId: id },
        });

        // Resolve new authors (upsert names)
        const authorIds: string[] = [];
        for (const authorName of data.authors) {
          const author = await tx.author.upsert({
            where: { name: authorName.trim() },
            update: {},
            create: { name: authorName.trim() },
          });
          authorIds.push(author.id);
        }

        // Create new BookAuthor relations
        for (const authorId of authorIds) {
          await tx.bookAuthor.create({
            data: {
              bookId: id,
              authorId,
            },
          });
        }
      }

      // Prepare scalar update data (excluding authors, which is handled separately)
      const { authors, ...scalarData } = data;

      // Update the book
      const updatedBook = await tx.book.update({
        where: { id },
        data: scalarData,
        include: {
          authors: {
            include: {
              author: true,
            },
          },
        },
      });

      return {
        ...updatedBook,
        authors: updatedBook.authors.map((ba) => ba.author),
      };
    });

    if (coverChanged && oldCoverUrl) {
      AdminService.deleteImage(oldCoverUrl).catch((err) => {
        console.error('[BooksService:updateBook:deleteImage:Error]', err);
      });
    }

    return result;
  }

  /**
   * Updates only the stock of a book in the database.
   * Validates product existence and uses a select block to omit author relations.
   */
  static async updateBookStock(id: string, stock: number) {
    const existing = await prisma.book.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new AppError('Libro no encontrado', 404);
    }

    const updated = await prisma.book.update({
      where: { id },
      data: { stock },
      select: {
        id: true,
        isbn: true,
        title: true,
        originalTitle: true,
        googleBooksId: true,
        publishedDate: true,
        language: true,
        synopsis: true,
        coverUrl: true,
        price: true,
        stock: true,
        badge: true,
        genre: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...updated,
      price: String(updated.price),
      authors: [],
    };
  }


  /**
   * Performs logical delete of a book by setting isActive to false.
   * Service method for deleting a book (either logically archiving or permanently removing).
   */
  static async deleteBook(id: string, permanent = false) {
    if (permanent) {
      const existing = await prisma.book.findUnique({
        where: { id },
      });
      if (existing?.coverUrl) {
        AdminService.deleteImage(existing.coverUrl).catch((err) => {
          console.error('[BooksService:deleteBook:deleteImage:Error]', err);
        });
      }
      return prisma.book.delete({
        where: { id },
      });
    }

    return prisma.book.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Retrieves a single active book by its ID.
   */
  static async getBookById(id: string) {
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        authors: {
          include: {
            author: true,
          },
        },
      },
    });

    if (!book || !book.isActive) {
      throw new AppError('Libro no encontrado', 404);
    }

    return {
      ...book,
      authors: book.authors.map((ba) => ba.author),
    };
  }

  /**
   * Returns list of active books with optional search filter and badge filter.
   */
  static async getBooks(query: GetBooksQuery) {
    const { search, badge, genre, page, limit, isActive } = query;
    const activeFilter = isActive !== undefined ? isActive : true;

    const skip = (page - 1) * limit;
    const take = limit;

    // RAMA 1: SIN BÚSQUEDA (Comportamiento Base con Prisma ORM)
    if (!search) {
      const where: any = {
        isActive: activeFilter,
      };

      if (badge) {
        where.badge = { equals: badge, mode: 'insensitive' };
      }

      if (genre) {
        where.genre = { equals: genre, mode: 'insensitive' };
      }

      const [data, total] = await prisma.$transaction([
        prisma.book.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            authors: {
              include: {
                author: true,
              },
            },
          },
        }),
        prisma.book.count({ where }),
      ]);

      const mappedData = data.map((book) => ({
        ...book,
        price: String(book.price),
        authors: book.authors.map((ba) => ba.author),
      }));

      return {
        data: mappedData,
        meta: {
          total,
          page,
          limit,
        },
      };
    }

    // RAMA 2: CON BÚSQUEDA ACTIVA (Optimización pg_trgm con $queryRaw)
    const whereConditions: Prisma.Sql[] = [Prisma.sql`b.is_active = ${activeFilter}`];
    const likeSearch = `%${search}%`;

    whereConditions.push(
      Prisma.sql`(b.title % ${search} OR b.title ILIKE ${likeSearch} OR b.original_title % ${search} OR b.original_title ILIKE ${likeSearch} OR COALESCE(auth_lateral.max_author_similarity, 0) > 0.3 OR COALESCE(auth_lateral.max_author_like, false) = true)`
    );

    if (badge) {
      whereConditions.push(Prisma.sql`b.badge ILIKE ${badge}`);
    }

    if (genre) {
      whereConditions.push(Prisma.sql`b.genre ILIKE ${genre}`);
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}`;

    const rows = await prisma.$queryRaw<any[]>`
      SELECT
        b.id,
        b.isbn,
        b.title,
        b.original_title AS "originalTitle",
        b.google_books_id AS "googleBooksId",
        b.published_date AS "publishedDate",
        b.language,
        b.synopsis,
        b.cover_url AS "coverUrl",
        b.price,
        b.stock,
        b.badge,
        b.genre,
        b.is_active AS "isActive",
        b.created_at AS "createdAt",
        b.updated_at AS "updatedAt",
        COALESCE(auth_lateral.authors_json, '[]'::json) AS authors,
        GREATEST(
          similarity(b.title, ${search}),
          similarity(COALESCE(b.original_title, ''), ${search}),
          COALESCE(auth_lateral.max_author_similarity, 0)
        ) AS _score,
        COUNT(*) OVER() AS _total
      FROM books b
      LEFT JOIN LATERAL (
        SELECT
          json_agg(json_build_object('id', a.id, 'name', a.name)) AS authors_json,
          MAX(similarity(a.name, ${search})) AS max_author_similarity,
          BOOL_OR(a.name ILIKE ${likeSearch}) AS max_author_like
        FROM book_authors ba
        JOIN authors a ON a.id = ba.author_id
        WHERE ba.book_id = b.id
      ) auth_lateral ON true
      ${whereClause}
      ORDER BY _score DESC, b.created_at DESC
      LIMIT ${limit}
      OFFSET ${skip}
    `;

    const total = rows.length > 0 ? Number(rows[0]._total) : 0;

    const mappedData = rows.map((row) => {
      // Handle potential different forms of json array returned by driver
      const rawAuthors = typeof row.authors === 'string'
        ? JSON.parse(row.authors)
        : row.authors;

      const { _score, _total, ...scalarData } = row;

      return {
        ...scalarData,
        price: String(row.price),
        authors: Array.isArray(rawAuthors) ? rawAuthors : [],
      };
    });

    return {
      data: mappedData,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  /**
   * Looks up a book by ISBN.
   * Checks Google Books API first; if that fails or returns nothing, falls back to Open Library API.
   * If both fail, it returns an empty metadata structure gracefully (Graceful Failure).
   */
  static async lookupBook(isbn: string): Promise<ISBNLookupResult> {
    try {
      const localBook = await prisma.book.findUnique({
        where: { isbn },
        include: {
          authors: {
            include: {
              author: true,
            },
          },
        },
      });

      if (localBook) {
        console.log(`[Lookup:CacheLocal] Libro encontrado localmente para ISBN: ${isbn}`);
        return {
          title: localBook.title,
          originalTitle: localBook.originalTitle,
          googleBooksId: localBook.googleBooksId,
          authors: localBook.authors.map((ba) => ba.author.name),
          synopsis: localBook.synopsis,
          coverUrl: localBook.coverUrl,
          publishedDate: localBook.publishedDate,
          language: localBook.language,
        };
      }
    } catch (error) {
      console.error(`[Lookup:CacheLocal] Error checking local database for ISBN ${isbn}:`, error);
    }

    let result: ISBNLookupResult | null = null;

    // Paso A: Búsqueda estricta en Google Books por ISBN
    try {
      result = await this.fetchFromGoogleBooks(isbn);
    } catch (error) {
      console.error(`[Lookup] Google Books API lookup failed for ISBN ${isbn}:`, error);
    }

    // Paso B: Si result es null, o si title o coverUrl son null, intentar Open Library
    if (!result || !result.title || !result.coverUrl) {
      try {
        const openLibraryResult = await this.fetchFromOpenLibrary(isbn);
        if (openLibraryResult) {
          if (result) {
            if (!result.title) result.title = openLibraryResult.title;
            if (!result.originalTitle) result.originalTitle = openLibraryResult.originalTitle;
            if (!result.coverUrl) result.coverUrl = openLibraryResult.coverUrl;
            if (!result.synopsis) result.synopsis = openLibraryResult.synopsis;
            if (result.authors.length === 0) result.authors = openLibraryResult.authors;
            if (!result.publishedDate) result.publishedDate = openLibraryResult.publishedDate;
          } else {
            result = openLibraryResult;
          }
        }
      } catch (error) {
        console.error(`[Lookup] Open Library API lookup failed for ISBN ${isbn}:`, error);
      }
    }

    // Paso C: Rescate Semántico si result o result.title sigue siendo null
    if (!result || !result.title) {
      try {
        console.log(`[Lookup] Strict lookup failed for ISBN ${isbn}. Initiating semantic search fallback...`);
        const semanticResult = await this.fetchFromGoogleBooksBySearch(isbn);
        if (semanticResult) {
          if (result) {
            result = {
              ...result,
              ...semanticResult,
              title: semanticResult.title || result.title,
              originalTitle: semanticResult.originalTitle || result.originalTitle,
              googleBooksId: semanticResult.googleBooksId || result.googleBooksId,
              authors: semanticResult.authors.length > 0 ? semanticResult.authors : result.authors,
              synopsis: semanticResult.synopsis || result.synopsis,
              coverUrl: semanticResult.coverUrl || result.coverUrl,
              publishedDate: semanticResult.publishedDate || result.publishedDate,
              language: semanticResult.language || result.language,
            };
          } else {
            result = semanticResult;
          }
        }
      } catch (error) {
        console.error(`[Lookup] Semantic search fallback failed for ISBN ${isbn}:`, error);
      }
    }

    // Paso D: Asegurar estructura base y log final
    const finalResult: ISBNLookupResult = result || {
      title: null,
      originalTitle: null,
      googleBooksId: null,
      authors: [],
      synopsis: null,
      coverUrl: null,
      publishedDate: null,
      language: null,
    };

    console.log(`[Lookup] Final result for ISBN ${isbn}:`, JSON.stringify(finalResult));
    return finalResult;
  }

  /**
   * Cleans HTML formatting, removes duplicated multilanguage sections (Spanish / English),
   * and translates non-Spanish synopses cleanly to Spanish without appending original English text.
   */
  private static async processSynopsis(rawSynopsis: string | null | undefined, lang: string | null | undefined): Promise<string | null> {
    if (!rawSynopsis || rawSynopsis.trim().length === 0) {
      return null;
    }

    // 1. Unescape HTML entities & strip HTML tags (<p>, <br>, <b>, <i>, etc.)
    let cleaned = rawSynopsis
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\n\s*\n+/g, '\n\n')
      .trim();

    if (!cleaned) return null;

    // 2. Detect & remove duplicate English/Spanish blocks if the source description contains both
    const englishMarkers = [
      /\benglish version\b/i,
      /\bdescription in english\b/i,
      /\boriginal synopsis\b/i,
      /\babout the author\b/i,
      /\bsynopsis in english\b/i,
    ];

    for (const marker of englishMarkers) {
      const match = cleaned.match(marker);
      if (match && match.index !== undefined && match.index > 50) {
        cleaned = cleaned.substring(0, match.index).trim();
        break;
      }
    }

    // 3. If the synopsis language is Spanish or contains Spanish indicators, return clean text directly
    const isSpanish = lang === 'es' || /[\u00C0-\u024F]/.test(cleaned) || /\b(el|la|los|las|un|una|con|por|para|sobre|historia|libro|novela)\b/i.test(cleaned);
    
    if (isSpanish) {
      return cleaned;
    }

    // 4. Translate English/foreign text to Spanish in chunks of max 450 chars to avoid MyMemory API limits
    try {
      const paragraphs = cleaned.split('\n\n').filter((p) => p.trim().length > 0);
      const translatedParagraphs: string[] = [];

      for (const p of paragraphs) {
        const chunks: string[] = [];
        let remaining = p.trim();
        while (remaining.length > 0) {
          if (remaining.length <= 450) {
            chunks.push(remaining);
            break;
          }
          let cutIndex = remaining.lastIndexOf('.', 450);
          if (cutIndex === -1 || cutIndex < 150) {
            cutIndex = remaining.lastIndexOf(' ', 450);
          }
          if (cutIndex === -1) {
            cutIndex = 450;
          }
          chunks.push(remaining.substring(0, cutIndex + 1).trim());
          remaining = remaining.substring(cutIndex + 1).trim();
        }

        const translatedChunks: string[] = [];
        for (const chunk of chunks) {
          const encoded = encodeURIComponent(chunk);
          const source = lang && lang !== 'es' ? lang : 'en';
          const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${source}|es`;
          const response = await fetch(url);
          if (response.ok) {
            const data = (await response.json()) as { responseData?: { translatedText?: string } };
            const transText = data.responseData?.translatedText;
            if (transText && transText.trim().length > 0) {
              translatedChunks.push(transText.trim());
            } else {
              translatedChunks.push(chunk);
            }
          } else {
            translatedChunks.push(chunk);
          }
        }
        translatedParagraphs.push(translatedChunks.join(' '));
      }

      const finalTranslated = translatedParagraphs.join('\n\n').trim();
      return finalTranslated.length > 0 ? finalTranslated : cleaned;
    } catch (err) {
      console.error('[BooksService:processSynopsis:Error]', err);
      return cleaned;
    }
  }

  /**
   * Helper to retrieve book information from Google Books API by Volume ID.
   */
  private static async fetchFromGoogleBooksById(id: string): Promise<ISBNLookupResult | null> {
    const fields = 'volumeInfo(title,authors,description,imageLinks,publishedDate,language)';
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const keyParam = apiKey ? `&key=${apiKey}` : '';
    const url = `https://www.googleapis.com/books/v1/volumes/${id}?fields=id,${encodeURIComponent(fields)}${keyParam}`;
    console.log(`[GoogleBooks:ID] GET ${url}`);
    const response = await fetch(url);
    console.log(`[GoogleBooks:ID] Response status: ${response.status}`);
    if (!response.ok) {
      const errText = await response.text();
      console.error(`[GoogleBooks:ID] Non-OK response: ${response.status} - ${errText.slice(0, 200)}`);
      return null;
    }

    const item = (await response.json()) as {
      id: string;
      volumeInfo?: {
        title?: string;
        authors?: string[];
        description?: string;
        imageLinks?: {
          extraLarge?: string;
          large?: string;
          medium?: string;
          small?: string;
          thumbnail?: string;
        };
        publishedDate?: string;
        language?: string;
      };
    };

    const info = item.volumeInfo;
    if (!info) {
      return null;
    }

    const imageLinks = info.imageLinks ?? {};
    const rawCover =
      imageLinks.extraLarge ??
      imageLinks.large ??
      imageLinks.medium ??
      imageLinks.small ??
      imageLinks.thumbnail ??
      null;

    const rawSynopsis = info.description ?? null;
    const lang = info.language ?? null;
    const synopsis = await this.processSynopsis(rawSynopsis, lang);

    return {
      title: info.title ?? null,
      originalTitle: info.title ?? null,
      googleBooksId: item.id ?? null,
      authors: info.authors ?? [],
      synopsis,
      coverUrl: sanitizeGoogleBooksUrl(rawCover),
      publishedDate: info.publishedDate ?? null,
      language: lang,
    };
  }

  /**
   * Helper to retrieve book information from Google Books API by search query.
   */
  private static async fetchFromGoogleBooksBySearch(query: string): Promise<ISBNLookupResult | null> {
    const fields = encodeURIComponent('items(id,volumeInfo(title,authors,description,imageLinks,publishedDate,language))');
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const keyParam = apiKey ? `&key=${apiKey}` : '';
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1&fields=${fields}${keyParam}`;
    console.log(`[GoogleBooks:Search] GET ${url}`);
    const response = await fetch(url);
    console.log(`[GoogleBooks:Search] Response status: ${response.status}`);
    if (!response.ok) {
      const errText = await response.text();
      console.error(`[GoogleBooks:Search] Non-OK response: ${response.status} - ${errText.slice(0, 200)}`);
      return null;
    }

    const data = (await response.json()) as {
      items?: Array<{
        id: string;
        volumeInfo?: {
          title?: string;
          authors?: string[];
          description?: string;
          imageLinks?: {
            extraLarge?: string;
            large?: string;
            medium?: string;
            small?: string;
            thumbnail?: string;
          };
          publishedDate?: string;
          language?: string;
        };
      }>;
    };

    if (!data.items || data.items.length === 0) {
      console.warn(`[GoogleBooks:Search] No items found for query: ${query}`);
      return null;
    }

    const firstItem = data.items[0];
    if (!firstItem) {
      return null;
    }

    const info = firstItem.volumeInfo;
    if (!info) {
      return null;
    }

    const imageLinks = info.imageLinks ?? {};
    const rawCover =
      imageLinks.extraLarge ??
      imageLinks.large ??
      imageLinks.medium ??
      imageLinks.small ??
      imageLinks.thumbnail ??
      null;

    const rawSynopsis = info.description ?? null;
    const lang = info.language ?? null;
    const synopsis = await this.processSynopsis(rawSynopsis, lang);

    return {
      title: info.title ?? null,
      originalTitle: info.title ?? null,
      googleBooksId: firstItem.id ?? null,
      authors: info.authors ?? [],
      synopsis,
      coverUrl: sanitizeGoogleBooksUrl(rawCover),
      publishedDate: info.publishedDate ?? null,
      language: lang,
    };
  }

  /**
   * Consults Google Books according to priorities:
   * 1. If googleBooksId is present, query directly by ID.
   * 2. If originalTitle and authors are present, query by originalTitle + authors.
   * 3. As a last resort, query by title + authors.
   * Nunca volver a buscar un libro por título si ya existe un googleBooksId.
   */
  static async queryGoogleBooks(params: {
    googleBooksId?: string | null;
    originalTitle?: string | null;
    title?: string | null;
    authors?: string[];
  }): Promise<ISBNLookupResult | null> {
    const { googleBooksId, originalTitle, title, authors = [] } = params;

    // 1. Si existe googleBooksId, consultar directamente por ese ID.
    if (googleBooksId) {
      try {
        const result = await this.fetchFromGoogleBooksById(googleBooksId);
        if (result) return result;
      } catch (error) {
        console.error(`[Google Books] Query by ID failed for ID ${googleBooksId}:`, error);
      }
      return null;
    }

    const authorQuery = authors.length > 0 ? ` inauthor:${authors.join(' ')}` : '';

    // 2. Si no existe, buscar utilizando originalTitle + autor.
    if (originalTitle) {
      try {
        const query = `intitle:${originalTitle}${authorQuery}`;
        const result = await this.fetchFromGoogleBooksBySearch(query);
        if (result) return result;
      } catch (error) {
        console.error(`[Google Books] Query by originalTitle failed for ${originalTitle}:`, error);
      }
    }

    // 3. Como último recurso, utilizar title + autor.
    if (title) {
      try {
        const query = `intitle:${title}${authorQuery}`;
        const result = await this.fetchFromGoogleBooksBySearch(query);
        if (result) return result;
      } catch (error) {
        console.error(`[Google Books] Query by title failed for ${title}:`, error);
      }
    }

    return null;
  }

  /**
   * Helper to retrieve book information from Google Books API by ISBN.
   */
  private static async fetchFromGoogleBooks(isbn: string): Promise<ISBNLookupResult | null> {
    const fields = encodeURIComponent('items(id,volumeInfo(title,authors,description,imageLinks,publishedDate,language))');
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const keyParam = apiKey ? `&key=${apiKey}` : '';
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&fields=${fields}${keyParam}`;
    console.log(`[GoogleBooks:ISBN] GET ${url}`);
    const response = await fetch(url);
    console.log(`[GoogleBooks:ISBN] Response status: ${response.status}`);
    if (!response.ok) {
      const errText = await response.text();
      console.error(`[GoogleBooks:ISBN] Non-OK response: ${response.status} - ${errText.slice(0, 200)}`);
      return null;
    }

    const data = (await response.json()) as {
      totalItems?: number;
      items?: Array<{
        id: string;
        volumeInfo?: {
          title?: string;
          authors?: string[];
          description?: string;
          imageLinks?: {
            extraLarge?: string;
            large?: string;
            medium?: string;
            small?: string;
            thumbnail?: string;
          };
          publishedDate?: string;
          language?: string;
        };
      }>;
    };

    if (!data.items || data.items.length === 0) {
      console.warn(`[GoogleBooks:ISBN] No items found for ISBN: ${isbn}`);
      return null;
    }

    const firstItem = data.items[0];
    if (!firstItem) {
      return null;
    }

    const info = firstItem.volumeInfo;
    if (!info) {
      return null;
    }

    const imageLinks = info.imageLinks ?? {};
    const rawCover =
      imageLinks.extraLarge ??
      imageLinks.large ??
      imageLinks.medium ??
      imageLinks.small ??
      imageLinks.thumbnail ??
      null;

    const rawSynopsis = info.description ?? null;
    const lang = info.language ?? null;
    const synopsis = await this.processSynopsis(rawSynopsis, lang);

    return {
      title: info.title ?? null,
      originalTitle: info.title ?? null,
      googleBooksId: firstItem.id ?? null,
      authors: info.authors ?? [],
      synopsis,
      coverUrl: sanitizeGoogleBooksUrl(rawCover),
      publishedDate: info.publishedDate ?? null,
      language: lang,
    };
  }

  /**
   * Helper to retrieve book information from Open Library API.
   */
  private static async fetchFromOpenLibrary(isbn: string): Promise<ISBNLookupResult | null> {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    console.log(`[OpenLibrary] GET ${url}`);
    const response = await fetch(url);
    console.log(`[OpenLibrary] Response status: ${response.status}`);
    if (!response.ok) {
      const errText = await response.text();
      console.error(`[OpenLibrary] Non-OK response: ${response.status} - ${errText.slice(0, 200)}`);
      return null;
    }

    const data = (await response.json()) as {
      [key: string]: {
        title?: string;
        authors?: Array<{ name: string }>;
        notes?: string;
        publish_date?: string;
        cover?: {
          large?: string;
          medium?: string;
          small?: string;
        };
      };
    };

    const keys = Object.keys(data);
    const targetKey = keys.find(k => k.toLowerCase() === `isbn:${isbn.toLowerCase()}`);
    if (!targetKey) {
      console.warn(`[OpenLibrary] ISBN ${isbn} not found in response keys: ${keys.join(', ')}`);
      return null;
    }

    const info = data[targetKey];
    if (!info) {
      return null;
    }

    const authorNames = info.authors && info.authors.length > 0
      ? info.authors.map((a) => a.name)
      : [];
    const coverUrl = info.cover?.large || info.cover?.medium || info.cover?.small || null;
    const synopsis = await this.processSynopsis(info.notes, null);

    return {
      title: info.title || null,
      originalTitle: info.title || null,
      googleBooksId: null,
      authors: authorNames,
      synopsis,
      coverUrl: coverUrl ? coverUrl.replace(/^http:/, 'https:') : null,
      publishedDate: info.publish_date || null,
      language: null,
    };
  }
}
