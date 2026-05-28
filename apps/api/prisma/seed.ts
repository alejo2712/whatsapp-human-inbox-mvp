import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_AGENT_EMAIL ?? 'agent@example.com';
  const password = process.env.SEED_AGENT_PASSWORD ?? 'changeme123';
  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashed,
      name: 'Default Agent',
      role: UserRole.ADMIN,
    },
  });

  console.log(`Seeded user: ${user.email} (${user.id})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
