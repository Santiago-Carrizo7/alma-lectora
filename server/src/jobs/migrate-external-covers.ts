import { prisma } from '../config/db.js';
import { BooksService } from '../modules/books/books.service.js';

async function migrateExternalCovers() {
  console.log('🚀 Starting cover image migration to Supabase WebP Storage...');

  const supabaseDomain = process.env.SUPABASE_URL || 'supabase.co';

  // 1. Migrate Books
  const booksToMigrate = await prisma.book.findMany({
    where: {
      isActive: true,
      coverUrl: {
        not: null,
      },
    },
  });

  const externalBooks = booksToMigrate.filter(
    (b) => b.coverUrl && !b.coverUrl.includes(supabaseDomain)
  );

  console.log(`[Migration] Found ${externalBooks.length} books with external cover URLs.`);

  for (const book of externalBooks) {
    if (!book.coverUrl) continue;
    console.log(`Processing Book ID: ${book.id} (${book.title}) - Current URL: ${book.coverUrl}`);
    const newCoverUrl = await BooksService.downloadAndProcessCover(book.coverUrl);

    if (newCoverUrl && newCoverUrl !== book.coverUrl) {
      await prisma.book.update({
        where: { id: book.id },
        data: { coverUrl: newCoverUrl },
      });
      console.log(`  ✓ Updated Book ID: ${book.id} -> ${newCoverUrl}`);
    } else {
      console.warn(`  ⚠️ Skipped or failed to convert Book ID: ${book.id}`);
    }
  }

  // 2. Migrate Accessories
  const accessoriesToMigrate = await prisma.accessory.findMany({
    where: {
      isActive: true,
      coverUrl: {
        not: null,
      },
    },
  });

  const externalAccessories = accessoriesToMigrate.filter(
    (a) => a.coverUrl && !a.coverUrl.includes(supabaseDomain)
  );

  console.log(`[Migration] Found ${externalAccessories.length} accessories with external cover URLs.`);

  for (const acc of externalAccessories) {
    if (!acc.coverUrl) continue;
    console.log(`Processing Accessory ID: ${acc.id} (${acc.title})`);
    const newCoverUrl = await BooksService.downloadAndProcessCover(acc.coverUrl);

    if (newCoverUrl && newCoverUrl !== acc.coverUrl) {
      await prisma.accessory.update({
        where: { id: acc.id },
        data: { coverUrl: newCoverUrl },
      });
      console.log(`  ✓ Updated Accessory ID: ${acc.id} -> ${newCoverUrl}`);
    }
  }

  // 3. Migrate Combos
  const combosToMigrate = await prisma.combo.findMany({
    where: {
      isActive: true,
      coverUrl: {
        not: null,
      },
    },
  });

  const externalCombos = combosToMigrate.filter(
    (c) => c.coverUrl && !c.coverUrl.includes(supabaseDomain)
  );

  console.log(`[Migration] Found ${externalCombos.length} combos with external cover URLs.`);

  for (const combo of externalCombos) {
    if (!combo.coverUrl) continue;
    console.log(`Processing Combo ID: ${combo.id} (${combo.title})`);
    const newCoverUrl = await BooksService.downloadAndProcessCover(combo.coverUrl);

    if (newCoverUrl && newCoverUrl !== combo.coverUrl) {
      await prisma.combo.update({
        where: { id: combo.id },
        data: { coverUrl: newCoverUrl },
      });
      console.log(`  ✓ Updated Combo ID: ${combo.id} -> ${newCoverUrl}`);
    }
  }

  console.log('✅ Migration process completed successfully.');
}

migrateExternalCovers()
  .catch((err) => {
    console.error('❌ Migration process encountered an error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
