import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  try {
    console.log('✓ Database seeding completed');
  } catch (error) {
    console.error('✗ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('Fatal seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
