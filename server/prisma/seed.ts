// prisma/seed.ts
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const dbUrl = process.env.DATABASE_URL || '';
const schemaMatch = dbUrl.match(/[?&]schema=([^&]+)/);
const schema = schemaMatch ? schemaMatch[1] : 'public';

const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool, { schema });
const prisma = new PrismaClient({ adapter });

// Tu lista real con los precios de venta ya calculados con margen
const BOOKS_TO_SEED = [
  {
    title: 'Boulevard Eterno',
    author: 'Flor M. Salvador',
    isbn: '9789807909068',
    price: 20000,
    stock: 1,
    badge: 'Novedad',
    genre: 'Romance Juvenil',
  },
  {
    title: 'Boulevard 3',
    author: 'Flor M. Salvador',
    isbn: '9788418594663',
    price: 20000,
    stock: 2,
    badge: null,
    genre: 'Romance Juvenil',
  },
  {
    title: 'King of Pride',
    author: 'Ana Huang',
    isbn: '9786073920100',
    price: 25000,
    stock: 1,
    badge: null,
    genre: 'Romance Contemporáneo',
  },
  {
    title: 'King of Wrath',
    author: 'Ana Huang',
    isbn: '9788408288725',
    price: 25000,
    stock: 1,
    badge: 'Más vendido',
    genre: 'Romance Contemporáneo',
  },
  {
    title: 'King of Sloth',
    author: 'Ana Huang',
    isbn: '9788408303992',
    price: 25000,
    stock: 1,
    badge: null,
    genre: 'Romance Contemporáneo',
  },
  {
    title: 'King of Greed',
    author: 'Ana Huang',
    isbn: '9788408299516',
    price: 25000,
    stock: 1,
    badge: null,
    genre: 'Romance Contemporáneo',
  },
  {
    title: 'El arte de ser nosotros',
    author: 'Inma Rubiales',
    isbn: '9788408267928',
    price: 25000,
    stock: 2,
    badge: null,
    genre: 'Romance Juvenil',
  },
  {
    title: 'Boulevard 2',
    author: 'Flor M. Salvador',
    isbn: '9788418798238',
    price: 20000,
    stock: 2,
    badge: null,
    genre: 'Romance Juvenil',
  },
  {
    title: 'Boulevard',
    author: 'Flor M. Salvador',
    isbn: '9788419169181',
    price: 20000,
    stock: 2,
    badge: null,
    genre: 'Romance Juvenil',
  },
  {
    title: 'Cuando no queden más estrellas que contar',
    author: 'María Martínez',
    isbn: '9789507325243',
    price: 18000,
    stock: 2,
    badge: 'Más vendido',
    genre: 'Romance Juvenil',
  },
  {
    title: 'Tres meses',
    author: 'Joana Marcús',
    isbn: '9788418798849',
    price: 25000,
    stock: 1,
    badge: null,
    genre: 'Romance Juvenil',
  },
  {
    title: 'Las luces de febrero',
    author: 'Joana Marcús',
    isbn: '9788419421135',
    price: 25000,
    stock: 1,
    badge: null,
    genre: 'Romance Juvenil',
  },
  {
    title: 'Después de diciembre',
    author: 'Joana Marcús',
    isbn: '9788490706466',
    price: 25000,
    stock: 1,
    badge: null,
    genre: 'Romance Juvenil',
  },
  {
    title: 'Todos los lugares que mantuvimos en secreto',
    author: 'Inma Rubiales',
    isbn: '9788408283461',
    price: 25000,
    stock: 2,
    badge: 'Más vendido',
    genre: 'Romance Juvenil',
  },
  {
    title: 'Todo lo que nunca fuimos',
    author: 'Alice Kellen',
    isbn: '9788408204824',
    price: 20000,
    stock: 1,
    badge: 'Más vendido',
    genre: 'Romance Contemporáneo',
  },
  {
    title: 'Iron Flame',
    author: 'Rebecca Yarros',
    isbn: '9786073910033',
    price: 25000,
    stock: 2,
    badge: 'Destacado',
    genre: 'Fantasía',
  },
  {
    title: 'Culpa vuestra',
    author: 'Mercedes Ron',
    isbn: '9786316620071',
    price: 20000,
    stock: 2,
    badge: null,
    genre: 'Romance Juvenil',
  },
];

function sanitizeUrlForSeed(url: string | null): string | null {
  if (!url) return null;
  if (!url.includes('books.google.com') && !url.includes('googleapis.com')) {
    return url;
  }
  try {
    const parsedUrl = new URL(url);
    parsedUrl.protocol = 'https:';
    parsedUrl.searchParams.set('zoom', '3');
    parsedUrl.searchParams.delete('edge');
    return parsedUrl.toString();
  } catch (e) {
    return url;
  }
}

async function translateForSeed(text: string, sourceLang: string): Promise<string> {
  try {
    const encoded = encodeURIComponent(text.substring(0, 500));
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=${sourceLang}|es`;
    const response = await fetch(url);
    if (!response.ok) return text;
    const data = await response.json() as { responseData?: { translatedText?: string } };
    const translated = data.responseData?.translatedText;
    return translated && translated.trim().length > 0 ? translated : text;
  } catch {
    return text;
  }
}

async function fetchMetadataByIsbn(isbn: string, title: string, author: string) {
  let coverUrl: string | null = null;

  // 1. [PRIMARIO] Intentar Open Library Covers CDN con HEAD
  try {
    const olCoverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
    const response = await fetch(olCoverUrl, { method: 'HEAD' });
    if (response.ok) {
      coverUrl = olCoverUrl;
      console.log(`[Seed-OL] Portada encontrada en Open Library para ISBN ${isbn}`);
    }
  } catch (olError) {
    console.error(`[Seed-OL-Error] Falló HEAD para Open Library para ISBN ${isbn}:`, olError);
  }

  // 2. [SECUNDARIO] Si no hay portada, buscar en Google Books por ISBN
  let googleBooksId: string | null = null;
  let originalTitle: string | null = null;
  let authors: string[] = [author];
  let publishedDate: string | null = null;
  let language: string | null = null;
  let synopsis: string | null = null;

  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const fields = encodeURIComponent('items(id,volumeInfo(title,authors,description,imageLinks,publishedDate,language))');
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&fields=${fields}&key=${apiKey}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json() as any;
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        const info = item.volumeInfo;
        googleBooksId = item.id || null;
        originalTitle = info.title || null;
        authors = info.authors || [author];
        publishedDate = info.publishedDate || null;
        language = info.language || null;
        synopsis = info.description || null;

        // Si no obtuvimos portada de Open Library, usamos la de Google Books
        if (!coverUrl) {
          const rawCover =
            info.imageLinks?.extraLarge ??
            info.imageLinks?.large ??
            info.imageLinks?.medium ??
            info.imageLinks?.small ??
            info.imageLinks?.thumbnail ??
            null;
          
          if (rawCover) {
            coverUrl = sanitizeUrlForSeed(rawCover);
            console.log(`[Seed-Google] Portada encontrada en Google Books para ISBN ${isbn}`);
          }
        }
      }
    }
  } catch (gbError) {
    console.error(`[Seed-Google-Error] Falló la consulta a Google Books para ISBN ${isbn}:`, gbError);
  }

  // Traducción de sinopsis
  if (synopsis && language && language !== 'es') {
    synopsis = await translateForSeed(synopsis, language);
  }

  return {
    isbn,
    googleBooksId,
    originalTitle: originalTitle || title,
    authors,
    publishedDate,
    language,
    synopsis: synopsis || 'Sin sinopsis disponible.',
    coverUrl,
  };
}

async function main() {
  console.log('Limpiando base de datos...');
  // Borrar en orden para respetar FK
  await prisma.bookAuthor.deleteMany();
  await prisma.book.deleteMany();
  await prisma.author.deleteMany();
  await prisma.user.deleteMany();
  await prisma.orderLead.deleteMany();

  console.log('Creando usuario administrador...');
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: { email: 'admin@almalectora.com', passwordHash, rol: 'ADMIN' },
  });

  console.log('Buscando metadatos e inyectando libros en lote...');

  for (const book of BOOKS_TO_SEED) {
    // Buscar datos reales por ISBN
    const meta = await fetchMetadataByIsbn(book.isbn, book.title, book.author);

    const finalIsbn = book.isbn;
    const finalCover = meta.coverUrl;
    const finalSynopsis = meta.synopsis;

    const authorNames = meta.authors;
    const authors = [];
    for (const name of authorNames) {
      const author = await prisma.author.upsert({
        where: { name: name.trim() },
        update: {},
        create: { name: name.trim() },
      });
      authors.push(author);
    }

    const createdBook = await prisma.book.create({
      data: {
        isbn: finalIsbn,
        title: book.title,
        originalTitle: meta.originalTitle,
        googleBooksId: meta.googleBooksId,
        publishedDate: meta.publishedDate,
        language: meta.language,
        synopsis: finalSynopsis,
        coverUrl: finalCover,
        price: book.price,
        stock: book.stock,
        badge: book.badge,
        genre: book.genre,
        isActive: true,
      },
    });

    for (const author of authors) {
      await prisma.bookAuthor.create({
        data: {
          bookId: createdBook.id,
          authorId: author.id,
        },
      });
    }

    // Pequeño delay para no saturar el rate limit de la API pública en el bucle
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log('Seed ejecutado correctamente con portadas y datos reales.');
}

main().finally(() => prisma.$disconnect());