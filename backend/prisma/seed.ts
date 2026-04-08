import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';
  const userPassword = process.env.SEED_USER_PASSWORD ?? 'User123!';

  const adminHash = await bcrypt.hash(adminPassword, 12);
  const userHash = await bcrypt.hash(userPassword, 12);

  await prisma.user.upsert({
    where: { email: 'admin@demo.train' },
    update: { passwordHash: adminHash, role: Role.ADMIN },
    create: {
      email: 'admin@demo.train',
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@demo.train' },
    update: { passwordHash: userHash, role: Role.USER },
    create: {
      email: 'user@demo.train',
      passwordHash: userHash,
      role: Role.USER,
    },
  });
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
