import pkg from "@prisma/client";
const { PrismaClient } = pkg;

export const prisma = new PrismaClient();


async function main() {
  const users = await prisma.user.findMany();
  console.log("Prisma OK:", users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
