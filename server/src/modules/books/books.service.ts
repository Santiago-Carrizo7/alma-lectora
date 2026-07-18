import { prisma } from '../../config/db.js';
import { Prisma } from '@prisma/client';
import type { ISBNLookupResult, GetBooksQuery } from './books.schemas.js';
import { AppError } from '../../utils/AppError.js';
import { sanitizeGoogleBooksUrl } from '../../utils/image.utils.js';

export class BooksService {
  /**
   * Creates a new book in the database.
   * Validates if the book's ISBN already exists.
   */
  static async createBook(data: any) {
    const existing = await prisma.book.findUnique({
      where: { isbn: data.isbn },
    });
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

    return prisma.$transaction(async (tx) => {
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
   */
  static async deleteBook(id: string) {
    const existing = await prisma.book.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new AppError('Libro no encontrado', 404);
    }

    await prisma.book.update({
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
    let result: ISBNLookupResult | null = null;

    try {
      result = await this.fetchFromGoogleBooks(isbn);
    } catch (error) {
      console.error(`[Lookup] Google Books API lookup failed for ISBN ${isbn}:`, error);
    }

    if (!result || !result.coverUrl) {
      try {
        const openLibraryResult = await this.fetchFromOpenLibrary(isbn);
        if (openLibraryResult) {
          if (result) {
            result.coverUrl = openLibraryResult.coverUrl;
            if (!result.synopsis) {
              result.synopsis = openLibraryResult.synopsis;
            }
          } else {
            result = openLibraryResult;
          }
        }
      } catch (error) {
        console.error(`[Lookup] Open Library API lookup failed for ISBN ${isbn}:`, error);
      }
    }

    return result || {
      title: null,
      originalTitle: null,
      googleBooksId: null,
      authors: [],
      synopsis: null,
      coverUrl: null,
      publishedDate: null,
      language: null,
    };
  }

  /**
   * Translates a synopsis to Spanish using MyMemory API.
   * Returns the original text on any failure (graceful).
   */
  private static async translateSynopsis(text: string, sourceLang: string): Promise<string> {
    try {
      const encoded = encodeURIComponent(text.substring(0, 500));
      const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${sourceLang}|es`;
      const response = await fetch(url);
      if (!response.ok) return text;
      const data = (await response.json()) as { responseData?: { translatedText?: string } };
      const translated = data.responseData?.translatedText;
      return translated && translated.trim().length > 0 ? translated : text;
    } catch {
      return text;
    }
  }

  /**
   * Helper to retrieve book information from Google Books API by Volume ID.
   */
  private static async fetchFromGoogleBooksById(id: string): Promise<ISBNLookupResult | null> {
    const fields = 'volumeInfo(title,authors,description,imageLinks,publishedDate,language)';
    const url = `https://www.googleapis.com/books/v1/volumes/${id}?fields=id,${encodeURIComponent(fields)}`;
    const response = await fetch(url);
    if (!response.ok) {
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

    const rawCover =
      info.imageLinks?.extraLarge ??
      info.imageLinks?.large ??
      info.imageLinks?.medium ??
      info.imageLinks?.small ??
      info.imageLinks?.thumbnail ??
      null;

    const rawSynopsis = info.description || null;
    const lang = info.language || null;
    const synopsis = rawSynopsis && lang && lang !== 'es'
      ? await this.translateSynopsis(rawSynopsis, lang)
      : rawSynopsis;

    return {
      title: info.title || null,
      originalTitle: info.title || null,
      googleBooksId: item.id || null,
      authors: info.authors || [],
      synopsis,
      coverUrl: sanitizeGoogleBooksUrl(rawCover),
      publishedDate: info.publishedDate || null,
      language: lang,
    };
  }

  /**
   * Helper to retrieve book information from Google Books API by search query.
   */
  private static async fetchFromGoogleBooksBySearch(query: string): Promise<ISBNLookupResult | null> {
    const fields = encodeURIComponent('items(id,volumeInfo(title,authors,description,imageLinks,publishedDate,language))');
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1&fields=${fields}`;
    const response = await fetch(url);
    if (!response.ok) {
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

    const rawCover =
      info.imageLinks?.extraLarge ??
      info.imageLinks?.large ??
      info.imageLinks?.medium ??
      info.imageLinks?.small ??
      info.imageLinks?.thumbnail ??
      null;

    const rawSynopsis = info.description || null;
    const lang = info.language || null;
    const synopsis = rawSynopsis && lang && lang !== 'es'
      ? await this.translateSynopsis(rawSynopsis, lang)
      : rawSynopsis;

    return {
      title: info.title || null,
      originalTitle: info.title || null,
      googleBooksId: firstItem.id || null,
      authors: info.authors || [],
      synopsis,
      coverUrl: sanitizeGoogleBooksUrl(rawCover),
      publishedDate: info.publishedDate || null,
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
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&fields=${fields}`;
    const response = await fetch(url);
    if (!response.ok) {
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

    const rawCover =
      info.imageLinks?.extraLarge ??
      info.imageLinks?.large ??
      info.imageLinks?.medium ??
      info.imageLinks?.small ??
      info.imageLinks?.thumbnail ??
      null;

    const rawSynopsis = info.description || null;
    const lang = info.language || null;
    const synopsis = rawSynopsis && lang && lang !== 'es'
      ? await this.translateSynopsis(rawSynopsis, lang)
      : rawSynopsis;

    return {
      title: info.title || null,
      originalTitle: info.title || null,
      googleBooksId: firstItem.id || null,
      authors: info.authors || [],
      synopsis,
      coverUrl: sanitizeGoogleBooksUrl(rawCover),
      publishedDate: info.publishedDate || null,
      language: lang,
    };
  }

  /**
   * Helper to retrieve book information from Open Library API.
   */
  private static async fetchFromOpenLibrary(isbn: string): Promise<ISBNLookupResult | null> {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    const response = await fetch(url);
    if (!response.ok) {
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

    return {
      title: info.title || null,
      originalTitle: info.title || null,
      googleBooksId: null,
      authors: authorNames,
      synopsis: info.notes || null,
      coverUrl: coverUrl ? coverUrl.replace(/^http:/, 'https:') : null,
      publishedDate: info.publish_date || null,
      language: null,
    };
  }
}
