import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const demo = await prisma.user.upsert({
    where: { email: "demo@asenglish.local" },
    update: {
      passwordHash,
      name: "Demo Learner",
      role: "learner",
    },
    create: {
      email: "demo@asenglish.local",
      name: "Demo Learner",
      passwordHash,
      role: "learner",
    },
  });

  console.log("Seeded user:", demo.email, "(password: demo1234)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
