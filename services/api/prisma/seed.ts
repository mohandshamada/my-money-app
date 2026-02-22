import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@mymoney.com';
const DEMO_PASSWORD = 'demo12345';

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      fullName: 'Demo User',
      timezone: 'UTC',
      currency: 'USD'
    },
    update: { passwordHash, fullName: 'Demo User' }
  });
  console.log('Demo user ready:', DEMO_EMAIL);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
