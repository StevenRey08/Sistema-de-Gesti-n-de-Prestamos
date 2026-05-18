const { prisma } = require('../db');

async function main() {
  console.log('Limpiando datos...');

  await prisma.$transaction(async (tx) => {
    await tx.movimiento.deleteMany();
    console.log('  Movimientos eliminados');

    await tx.prestamoDetalle.deleteMany();
    console.log('  Detalles de préstamo eliminados');

    await tx.prestamo.deleteMany();
    console.log('  Préstamos eliminados');

    await tx.detallePedido.deleteMany();
    console.log('  Detalles de pedido eliminados');

    await tx.pedido.deleteMany();
    console.log('  Pedidos eliminados');

    await tx.inventario.deleteMany();
    console.log('  Inventario eliminado');

    await tx.categoriaHerramienta.deleteMany();
    console.log('  Categorías eliminadas');

    await tx.ubicacion.deleteMany();
    console.log('  Ubicaciones eliminadas');

    await tx.persona.deleteMany();
    console.log('  Personas eliminadas');
  });

  console.log('Datos limpiados. Usuarios, roles, permisos y módulos intactos.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
