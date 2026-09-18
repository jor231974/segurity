import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ALL_PERMISSIONS } from '@servicom/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de desarrollo...');

  // 1. Crear empresa demo
  const company = await prisma.company.create({
    data: {
      id: 'c0000001-0000-0000-0000-000000000001',
      legalName: 'Servicios de Seguridad Privada Grupo Servicom S.A. de C.V.',
      commercialName: 'Grupo Servicom',
      rfc: 'SSP123456789',
      address: 'Av. Reforma 123, Col. Centro, Ciudad de México, CP 06000',
      phone: '+52 55 1234 5678',
      email: 'admin@gruposervicom.com',
      timezone: 'America/Mexico_City',
      currency: 'MXN',
    },
  });

  // 2. Crear empresa B (para prueba de aislamiento multiempresa)
  const companyB = await prisma.company.create({
    data: {
      id: 'c0000002-0000-0000-0000-000000000002',
      legalName: 'Protección Total del Norte S.A. de C.V.',
      commercialName: 'ProTotal Norte',
      rfc: 'PTN987654321',
      address: 'Blvd. Independencia 456, Monterrey, Nuevo León, CP 64000',
      phone: '+52 81 8765 4321',
      email: 'admin@prototal.com',
      timezone: 'America/Mexico_City',
      currency: 'MXN',
    },
  });

  // 3. Crear roles con permisos
  const allPerms = ALL_PERMISSIONS;
  const roles = await Promise.all([
    prisma.role.create({ data: { code: 'SUPER_ADMIN', name: 'Superadministrador', isSystem: true } }),
    prisma.role.create({ data: { code: 'DIRECTOR', name: 'Director', isSystem: true } }),
    prisma.role.create({ data: { code: 'ADMINISTRATOR', name: 'Administrador', isSystem: true } }),
    prisma.role.create({ data: { code: 'HR', name: 'Recursos Humanos', isSystem: true } }),
    prisma.role.create({ data: { code: 'OPS_COORDINATOR', name: 'Coordinador de Operaciones', isSystem: true } }),
    prisma.role.create({ data: { code: 'SUPERVISOR', name: 'Supervisor', isSystem: true } }),
    prisma.role.create({ data: { code: 'MONITOR', name: 'Monitor', isSystem: true } }),
    prisma.role.create({ data: { code: 'GUARD', name: 'Guardia', isSystem: true } }),
    prisma.role.create({ data: { code: 'ACCOUNTING', name: 'Contabilidad', isSystem: true } }),
    prisma.role.create({ data: { code: 'CLIENT', name: 'Cliente', isSystem: true } }),
  ]);

  // 4. Crear permisos
  const permMap = new Map<string, { id: string; code: string }>();
  for (const perm of allPerms) {
    const p = await prisma.permission.upsert({
      where: { code: perm },
      create: { code: perm, description: perm },
      update: {},
    });
    permMap.set(perm, p);
  }

  // 5. Asignar todos los permisos al SUPER_ADMIN
  const superAdmin = roles.find((r) => r.code === 'SUPER_ADMIN')!;
  await prisma.rolePermission.createMany({
    data: allPerms.map((code) => ({ roleId: superAdmin.id, permissionId: permMap.get(code)!.id })),
  });

  // Asignar permisos a otros roles (ejemplo simplificado)
  const admin = roles.find((r) => r.code === 'ADMINISTRATOR')!;
  const adminPerms = allPerms.filter((p) => !p.startsWith('superadmin.'));
  await prisma.rolePermission.createMany({
    data: adminPerms.map((code) => ({ roleId: admin.id, permissionId: permMap.get(code)!.id })).filter((x) => x.permissionId),
  });

  // Permisos del rol CLIENT (portal del cliente)
  const clientRole = roles.find((r) => r.code === 'CLIENT')!;
  await prisma.rolePermission.createMany({
    data: ['client.portal.access', 'client.request.create', 'client.request.view']
      .map((code) => ({ roleId: clientRole.id, permissionId: permMap.get(code)!.id }))
      .filter((x) => x.permissionId),
  });

  // 6. Crear usuarios demo
  const adminHash = await bcrypt.hash('Admin123!', 12);
  const supervisorHash = await bcrypt.hash('Supervisor123!', 12);
  const guardHash = await bcrypt.hash('Guardia123!', 12);

  const adminUser = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'admin@gruposervicom.com',
      passwordHash: adminHash,
      name: 'Carlos',
      lastName: 'García',
      phone: '+52 55 1234 5679',
      active: true,
      userRoles: { create: { roleId: admin.id } },
    },
  });

  const supervisorUser = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'supervisor@gruposervicom.com',
      passwordHash: supervisorHash,
      name: 'María',
      lastName: 'López',
      phone: '+52 55 2345 6789',
      active: true,
      userRoles: { create: { roleId: roles.find((r) => r.code === 'SUPERVISOR')!.id } },
    },
  });

  const guardUser = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'guardia@gruposervicom.com',
      passwordHash: guardHash,
      name: 'Juan',
      lastName: 'Pérez',
      phone: '+52 55 3456 7890',
      active: true,
      userRoles: { create: { roleId: roles.find((r) => r.code === 'GUARD')!.id } },
    },
  });

  // Usuario de empresa B
  await prisma.user.create({
    data: {
      companyId: companyB.id,
      email: 'admin@prototal.com',
      passwordHash: adminHash,
      name: 'Roberto',
      lastName: 'Sánchez',
      phone: '+52 81 1111 2222',
      active: true,
      userRoles: { create: { roleId: admin.id } },
    },
  });

  // 7. Zonas y departamentos
  const zona = await prisma.zone.create({ data: { companyId: company.id, name: 'Zona Centro', description: 'Ciudad de México centro' } });
  const dept = await prisma.branch.create({ data: { companyId: company.id, name: 'Sucursal Principal', address: company.address, phone: company.phone } });

  // 8. Cliente demo
  const client = await prisma.client.create({
    data: {
      companyId: company.id,
      legalName: 'Comercializadora ABC S.A. de C.V.',
      commercialName: 'ABC Corp',
      rfc: 'CCA123456789',
      email: 'contacto@abccorp.com',
      phone: '+52 55 9876 5432',
      address: 'Calzada de Tlalpan 789, Col. Portales, CDMX CP 03300',
      status: 'activo',
      contacts: { create: [{ name: 'Roberto Morales', position: 'Gerente', phone: '+52 55 9876 5433', email: 'rmorales@abccorp.com', isPrimary: true }] },
    },
  });

  // Usuario del portal cliente (rol CLIENT) vinculado al cliente
  const clientHash = await bcrypt.hash('Cliente123!', 12);
  const clientUser = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'cliente@abccorp.com',
      passwordHash: clientHash,
      name: 'Roberto',
      lastName: 'Morales',
      phone: '+52 55 9876 5433',
      active: true,
      userRoles: { create: { roleId: clientRole.id } },
    },
  });
  await prisma.clientUser.create({
    data: { clientId: client.id, userId: clientUser.id },
  });

  // 9. Contrato y servicio
  const contract = await prisma.contract.create({
    data: {
      companyId: company.id,
      clientId: client.id,
      number: 'CTR-2026-001',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      billingFrequency: 'mensual',
      status: 'activo',
    },
  });

  // 10. Instalación (sitio)
  const site = await prisma.site.create({
    data: {
      clientId: client.id,
      name: 'Planta ABC - Chalco',
      address: 'Av. Industrial 123, Chalco, Estado de México',
      latitude: 19.2652,
      longitude: -98.8966,
      geofenceRadiusMeters: 100,
      contactName: 'Ing. Roberto Morales',
      contactPhone: '+52 55 9876 5433',
      instructions: 'Presentarse con identificación. Llamar al contacto antes de entrar.',
    },
  });

  // Servicio
  const service = await prisma.contractService.create({
    data: {
      contractId: contract.id,
      siteId: site.id,
      name: 'Vigilancia 24/7',
      guardCount: 2,
      tariff: 12000,
      estimatedCost: 9600,
      startDate: new Date('2026-01-01'),
    },
  });

  // 11. Puestos
  const post1 = await prisma.post.create({
    data: { siteId: site.id, name: 'Entrada Principal', shiftStart: '07:00', shiftEnd: '19:00', active: true },
  });
  const post2 = await prisma.post.create({
    data: { siteId: site.id, name: 'Rondín Nocturno', shiftStart: '19:00', shiftEnd: '07:00', active: true },
  });

  // 12. Guardia
  const guard = await prisma.guard.create({
    data: {
      companyId: company.id,
      employeeNumber: 'GU-001',
      userId: guardUser.id,
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '+52 55 3456 7890',
      email: 'guardia@gruposervicom.com',
      address: 'Calzada de Tlalpan 789',
      hireDate: new Date('2026-01-15'),
      status: 'asignado',
      zoneId: zona.id,
    },
  });

  // 13. Consigna
  await prisma.consign.create({
    data: {
      postId: post1.id,
      title: 'Instrucciones de acceso',
      content: '1. Verificar identificación de todos los visitantes\n2. Registrar entradas en bitácora\n3. No permitir acceso sin autorización\n4. Reportar cualquier anomalía al supervisor',
      version: '1.0',
      authorId: supervisorUser.id,
    },
  });

  // 14. Ruta de rondín con checkpoints
  const route = await prisma.patrolRoute.create({
    data: { siteId: site.id, postId: post1.id, name: 'Ruta Principal', schedule: 'Cada 2 horas' },
  });
  await prisma.patrolCheckpoint.createMany({
    data: [
      { routeId: route.id, name: 'Puerta Norte', sequence: 0, latitude: 19.2655, longitude: -98.8960 },
      { routeId: route.id, name: 'Estacionamiento', sequence: 1, latitude: 19.2650, longitude: -98.8970 },
      { routeId: route.id, name: 'Almacén', sequence: 2, latitude: 19.2648, longitude: -98.8965 },
    ],
  });

  // 15. Turno para hoy
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.shift.create({
    data: {
      guardId: guard.id,
      postId: post1.id,
      serviceId: service.id,
      date: today,
      startTime: '07:00',
      endTime: '19:00',
      status: 'programado',
    },
  });

  // 16. Tipos de incidencia
  const incidentTypes = ['Robo', 'Intento de robo', 'Persona sospechosa', 'Accidente', 'Daño', 'Incendio', 'Emergencia médica', 'Falla de equipo', 'Otra'];
  await prisma.incidentType.createMany({
    data: incidentTypes.map((name) => ({
      companyId: company.id,
      name,
      color: name.includes('Robo') ? '#dc2626' : name.includes('Accidente') ? '#f59e0b' : '#3b82f6',
    })),
  });

  // 17. Configuración del sistema
  await prisma.systemSetting.createMany({
    data: [
      { companyId: company.id, key: 'video_expiration_hours', value: { value: 48 }, description: 'Horas de retención de video' },
      { companyId: company.id, key: 'geofence_default_radius', value: { value: 100 }, description: 'Radio de geocerca por defecto (m)' },
      { companyId: company.id, key: 'gps_interval_seconds', value: { value: 30 }, description: 'Intervalo de reporte GPS' },
    ],
  });

  console.log('Seed completado exitosamente.');
  console.log(`  Empresa A: ${company.legalName} (${company.id})`);
  console.log(`  Empresa B: ${companyB.legalName} (${companyB.id})`);
  console.log(`  Roles: ${roles.length} creados`);
  console.log(`  Permisos: ${permMap.size} creados`);
  console.log(`  Usuarios: admin@gruposervicom.com / Admin123!`);
  console.log(`  Usuarios: supervisor@gruposervicom.com / Supervisor123!`);
  console.log(`  Usuarios: guardia@gruposervicom.com / Guardia123!`);
  console.log(`  Usuarios: cliente@abccorp.com / Cliente123! (portal cliente)`);
  console.log(`  Usuarios: admin@prototal.com / Admin123! (empresa B)`);
  console.log(`  Cliente: ${client.commercialName}`);
  console.log(`  Contrato: ${contract.number}`);
  console.log(`  Instalación: ${site.name}`);
  console.log(`  Puestos: ${post1.name}, ${post2.name}`);
  console.log(`  Guardia: ${guard.firstName} ${guard.lastName} (${guard.employeeNumber})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error en seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });