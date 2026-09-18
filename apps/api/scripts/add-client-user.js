require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();

  const client = await prisma.client.findFirst({ where: { commercialName: 'ABC Corp' } });
  if (!client) throw new Error('Cliente ABC Corp no encontrado');

  const clientRole = await prisma.role.findUnique({ where: { code: 'CLIENT' } });
  if (!clientRole) throw new Error('Rol CLIENT no encontrado');

  const perms = [
    'client.portal.access',
    'client.request.create',
    'client.request.view',
  ];
  let added = 0;
  for (const code of perms) {
    const p = await prisma.permission.findUnique({ where: { code } });
    if (!p) continue;
    const exists = await prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId: clientRole.id, permissionId: p.id } },
    });
    if (!exists) {
      await prisma.rolePermission.create({ data: { roleId: clientRole.id, permissionId: p.id } });
      added++;
    }
  }
  console.log(`Permisos CLIENT agregados: ${added}`);

  let user = await prisma.user.findUnique({ where: { email: 'cliente@abccorp.com' } });
  if (!user) {
    const hash = await bcrypt.hash('Cliente123!', 12);
    user = await prisma.user.create({
      data: {
        companyId: client.companyId,
        email: 'cliente@abccorp.com',
        passwordHash: hash,
        name: 'Roberto',
        lastName: 'Morales',
        phone: '+52 55 9876 5433',
        active: true,
        userRoles: { create: { roleId: clientRole.id } },
      },
    });
    console.log(`Usuario cliente creado: ${user.id}`);
  } else {
    console.log('Usuario cliente ya existía');
  }

  const link = await prisma.clientUser.findUnique({ where: { userId: user.id } });
  if (!link) {
    await prisma.clientUser.create({ data: { clientId: client.id, userId: user.id } });
    console.log('Vínculo ClientUser creado');
  } else {
    console.log('Vínculo ya existía');
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});