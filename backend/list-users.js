const { prisma } = require('./db');

async function main() {
  const users = await prisma.usuario.findMany({
    include: { rol: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
