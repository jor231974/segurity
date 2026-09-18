import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { ALL_PERMISSIONS } from '@servicom/shared';

const prisma = new PrismaClient();

function warnCode(e: unknown): string | null {
  if (e && typeof e === 'object' && 'code' in e) {
    const code = (e as { code?: string }).code;
    if (code === 'P2002') return 'dup';
  }
  return null;
}

async function main() {
  console.log('Iniciando seed de desarrollo...');

  // 1. Empresa demo (idempotente)
  const companyAId = 'c0000001-0000-0000-0000-000000000001';
  const companyBId = 'c0000002-0000-0000-0000-000000000002';
  const company = await prisma.company.upsert({
    where: { id: companyAId },
    update: {},
    create: {
      id: companyAId,
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

  const companyB = await prisma.company.upsert({
    where: { id: companyBId },
    update: {},
    create: {
      id: companyBId,
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

  // 2. Roles (idempotente)
  const roleCodes = ['SUPER_ADMIN', 'DIRECTOR', 'ADMINISTRATOR', 'HR', 'OPS_COORDINATOR', 'SUPERVISOR', 'MONITOR', 'GUARD', 'ACCOUNTING', 'CLIENT'];
  const roleNames: Record<string, string> = {
    SUPER_ADMIN: 'Superadministrador',
    DIRECTOR: 'Director',
    ADMINISTRATOR: 'Administrador',
    HR: 'Recursos Humanos',
    OPS_COORDINATOR: 'Coordinador de Operaciones',
    SUPERVISOR: 'Supervisor',
    MONITOR: 'Monitor',
    GUARD: 'Guardia',
    ACCOUNTING: 'Contabilidad',
    CLIENT: 'Cliente',
  };
  const roles: Record<string, { id: string; code: string }> = {};
  for (const code of roleCodes) {
    const role = await prisma.role.upsert({
      where: { code },
      update: {},
      create: { code, name: roleNames[code], isSystem: true },
    });
    roles[code] = role;
  }

  // 3. Permisos (idempotente)
  const permMap = new Map<string, { id: string; code: string }>();
  for (const perm of ALL_PERMISSIONS) {
    const p = await prisma.permission.upsert({
      where: { code: perm },
      create: { code: perm, description: perm },
      update: {},
    });
    permMap.set(perm, p);
  }

  // 4. Asignar permisos a roles (idempotente, skip duplicados)
  const allPerms = ALL_PERMISSIONS;
  const bindPerms = async (roleId: string, codes: string[]) => {
    await prisma.rolePermission.createMany({
      data: codes
        .map((code) => ({ roleId, permissionId: permMap.get(code)?.id }))
        .filter((x): x is { roleId: string; permissionId: string } => Boolean(x.permissionId)),
      skipDuplicates: true,
    });
  };
  await bindPerms(roles.SUPER_ADMIN.id, allPerms);
  await bindPerms(roles.ADMINISTRATOR.id, allPerms.filter((p) => !p.startsWith('superadmin.')));
  await bindPerms(roles.CLIENT.id, ['client.portal.access', 'client.request.create', 'client.request.view']);

  // 5. Usuarios demo (idempotente)
  const adminHash = await bcrypt.hash('Admin123!', 12);
  const supervisorHash = await bcrypt.hash('Supervisor123!', 12);
  const guardHash = await bcrypt.hash('Guardia123!', 12);
  const clientHash = await bcrypt.hash('Cliente123!', 12);

  const ensureUser = async (data: {
    companyId: string;
    email: string;
    passwordHash: string;
    name: string;
    lastName: string;
    phone?: string;
    roleId: string;
  }) => {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: { active: true },
      create: {
        companyId: data.companyId,
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        lastName: data.lastName,
        phone: data.phone ?? '',
        active: true,
      },
    });
    await prisma.userRole
      .create({ data: { userId: user.id, roleId: data.roleId } })
      .catch((e) => warnCode(e));
    return user;
  };

  const adminUser = await ensureUser({
    companyId: company.id,
    email: 'admin@gruposervicom.com',
    passwordHash: adminHash,
    name: 'Carlos',
    lastName: 'García',
    phone: '+52 55 1234 5679',
    roleId: roles.ADMINISTRATOR.id,
  });

  const supervisorUser = await ensureUser({
    companyId: company.id,
    email: 'supervisor@gruposervicom.com',
    passwordHash: supervisorHash,
    name: 'María',
    lastName: 'López',
    phone: '+52 55 2345 6789',
    roleId: roles.SUPERVISOR.id,
  });

  const guardUser = await ensureUser({
    companyId: company.id,
    email: 'guardia@gruposervicom.com',
    passwordHash: guardHash,
    name: 'Juan',
    lastName: 'Pérez',
    phone: '+52 55 3456 7890',
    roleId: roles.GUARD.id,
  });

  await ensureUser({
    companyId: companyB.id,
    email: 'admin@prototal.com',
    passwordHash: adminHash,
    name: 'Roberto',
    lastName: 'Sánchez',
    phone: '+52 81 1111 2222',
    roleId: roles.ADMINISTRATOR.id,
  });

  // 6. Zonas, sucursales, cliente, usuario de portal del cliente
  let zona = await prisma.zone.findFirst({ where: { companyId: company.id, name: 'Zona Centro' } });
  if (!zona) zona = await prisma.zone.create({ data: { companyId: company.id, name: 'Zona Centro', description: 'Ciudad de México centro' } });

  const dept = await prisma.branch.findFirst({ where: { companyId: company.id, name: 'Sucursal Principal' } });
  if (!dept) await prisma.branch.create({ data: { companyId: company.id, name: 'Sucursal Principal', address: company.address, phone: company.phone } });

  let client = await prisma.client.findFirst({ where: { companyId: company.id, commercialName: 'ABC Corp' } });
  if (!client) {
    client = await prisma.client.create({
      data: {
        companyId: company.id,
        legalName: 'Comercializadora ABC S.A. de C.V.',
        commercialName: 'ABC Corp',
        rfc: 'CCA123456789',
        email: 'contacto@abccorp.com',
        phone: '+52 55 9876 5432',
        address: 'Calzada de Tlalpan 789, Col. Portales, CDMX CP 03300',
        status: 'activo',
      },
    });
  }

  await prisma.clientContact.createMany({
    data: [{ name: 'Roberto Morales', position: 'Gerente', phone: '+52 55 9876 5433', email: 'rmorales@abccorp.com', isPrimary: true, clientId: client.id }],
    skipDuplicates: true,
  }).catch(() => undefined);

  const clientUser = await ensureUser({
    companyId: company.id,
    email: 'cliente@abccorp.com',
    passwordHash: clientHash,
    name: 'Roberto',
    lastName: 'Morales',
    phone: '+52 55 9876 5433',
    roleId: roles.CLIENT.id,
  });
  await prisma.clientUser
    .create({ data: { clientId: client.id, userId: clientUser.id } })
    .catch((e) => warnCode(e));

  // 7. Contrato y servicio
  const contract = await prisma.contract.upsert({
    where: { companyId_number: { companyId: company.id, number: 'CTR-2026-001' } },
    update: {},
    create: {
      companyId: company.id,
      clientId: client.id,
      number: 'CTR-2026-001',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      billingFrequency: 'mensual',
      status: 'activo',
    },
  });

  let site = await prisma.site.findFirst({ where: { clientId: client.id, name: 'Planta ABC - Chalco' } });
  if (!site) {
    site = await prisma.site.create({
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
  }

  let service = await prisma.contractService.findFirst({ where: { contractId: contract.id, name: 'Vigilancia 24/7' } });
  if (!service) {
    service = await prisma.contractService.create({
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
  }

  // 8. Puestos
  let post1 = await prisma.post.findFirst({ where: { siteId: site.id, name: 'Entrada Principal' } });
  if (!post1) post1 = await prisma.post.create({ data: { siteId: site.id, name: 'Entrada Principal', shiftStart: '07:00', shiftEnd: '19:00', active: true } });
  let post2 = await prisma.post.findFirst({ where: { siteId: site.id, name: 'Rondín Nocturno' } });
  if (!post2) post2 = await prisma.post.create({ data: { siteId: site.id, name: 'Rondín Nocturno', shiftStart: '19:00', shiftEnd: '07:00', active: true } });

  // 9. Guardia
  const guard = await prisma.guard.upsert({
    where: { employeeNumber: 'GU-001' },
    update: {},
    create: {
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
  }).catch(async () => prisma.guard.findFirst({ where: { employeeNumber: 'GU-001' } }).then((g) => g!));

  // 10. Consigna
  await prisma.consign.create({
    data: {
      postId: post1.id,
      title: 'Instrucciones de acceso',
      content: '1. Verificar identificación de todos los visitantes\n2. Registrar entradas en bitácora\n3. No permitir acceso sin autorización\n4. Reportar cualquier anomalía al supervisor',
      version: '1.0',
      authorId: supervisorUser.id,
    },
  }).catch((e) => warnCode(e));

  // 11. Ruta de rondín con checkpoints
  let route = await prisma.patrolRoute.findFirst({ where: { siteId: site.id, name: 'Ruta Principal' } });
  if (!route) route = await prisma.patrolRoute.create({ data: { siteId: site.id, postId: post1.id, name: 'Ruta Principal', schedule: 'Cada 2 horas' } });
  await prisma.patrolCheckpoint.createMany({
    data: [
      { routeId: route.id, name: 'Puerta Norte', sequence: 0, latitude: 19.2655, longitude: -98.8960 },
      { routeId: route.id, name: 'Estacionamiento', sequence: 1, latitude: 19.2650, longitude: -98.8970 },
      { routeId: route.id, name: 'Almacén', sequence: 2, latitude: 19.2648, longitude: -98.8965 },
    ],
    skipDuplicates: true,
  });

  // 12. Turno para hoy
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
  }).catch((e) => warnCode(e));

  // 13. Tipos de incidencia
  const incidentTypes = ['Robo', 'Intento de robo', 'Persona sospechosa', 'Accidente', 'Daño', 'Incendio', 'Emergencia médica', 'Falla de equipo', 'Otra'];
  await prisma.incidentType.createMany({
    data: incidentTypes.map((name) => ({
      companyId: company.id,
      name,
      color: name.includes('Robo') ? '#dc2626' : name.includes('Accidente') ? '#f59e0b' : '#3b82f6',
    })),
    skipDuplicates: true,
  });

  // 14. Configuración del sistema
  await prisma.systemSetting.createMany({
    data: [
      { companyId: company.id, key: 'video_expiration_hours', value: { value: 48 }, description: 'Horas de retención de video' },
      { companyId: company.id, key: 'geofence_default_radius', value: { value: 100 }, description: 'Radio de geocerca por defecto (m)' },
      { companyId: company.id, key: 'gps_interval_seconds', value: { value: 30 }, description: 'Intervalo de reporte GPS' },
    ],
    skipDuplicates: true,
  });

  console.log('Seed completado exitosamente.');
  console.log(`  Empresa A: ${company.legalName} (${company.id})`);
  console.log(`  Empresa B: ${companyB.legalName} (${companyB.id})`);
  console.log(`  Roles: ${Object.keys(roles).length} creados`);
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