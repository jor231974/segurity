require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  const guard = await prisma.guard.findFirst({ where: { employeeNumber: 'GU-001' } });
  console.log('guard:', guard?.id);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const shift = await prisma.shift.findFirst({
    where: {
      guardId: guard.id,
      date: new Date(todayStr + 'T00:00:00.000Z'),
      status: { in: ['programado', 'activo'] },
    },
    orderBy: { startTime: 'asc' },
  });
  console.log('shift:', shift?.id, shift?.status, 'postId:', shift?.postId);

  const typeName = 'otra';
  const t = await prisma.incidentType.findUnique({ where: { id: undefined } });
  console.log('typeName from findUnique undefined:', t?.name);

  const incident = await prisma.incident.create({
    data: {
      companyId: 'c0000001-0000-0000-0000-000000000001',
      typeId: null,
      typeName: 'otra',
      severity: 'media',
      status: 'abierta',
      description: 'test directo prisma',
      reporterId: guard.id,
      guardId: guard.id,
      shiftId: shift?.id || null,
      latitude: 19.265,
      longitude: -98.897,
      synced: false,
    },
    include: { reporter: true, shift: { include: { post: true } } },
  });
  console.log('INCIDENT CREADO:', incident.id);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('ERROR:', e);
  process.exit(1);
});