import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

/**
 * DATOS DE PRESENTACIÓN (Fase A — demo comercial)
 * Puebla la Empresa A (Grupo Servicom) con una cartera realista para la demo:
 * clientes en varios estados de México, contratos, servicios, instalaciones
 * con geocerca, puestos, guardias asignados por cliente y turnos de hoy.
 *
 * Idempotente: solo crea lo que no exista. No borra ni modifica nada existente.
 * createdAt fijo en 2025 para no mover a ABC Corp / datos E2E de la primera página.
 */
const prisma = new PrismaClient();

const COMPANY_A = 'c0000001-0000-0000-0000-000000000001';

function hoje(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  console.log('Cargando datos de presentación (Empresa A)...');

  const company = await prisma.company.findUnique({ where: { id: COMPANY_A } });
  if (!company) {
    throw new Error('No existe la Empresa A. Ejecuta primero el seed (npm run db:seed).');
  }

  const changedById = await prisma.user.findFirst({ where: { companyId: COMPANY_A, email: 'admin@gruposervicom.com' } });

  const zonas = await Promise.all([
    ensureZone('Zona Norte', 'Monterrey y noreste'),
    ensureZone('Zona Occidente', 'Guadalajara y occidente'),
    ensureZone('Zona Bajío', 'Querétaro y bajío'),
  ]);
  const [zonaNorteId, zonaOccidenteId, zonaBajioId] = zonas;

  // ---------- Cartera 1: Almacenes del Norte (Monterrey, NL) ----------
  const cliente1 = await ensureCliente({
    legalName: 'Almacenes del Norte S.A. de C.V.',
    commercialName: 'Almacenes del Norte',
    rfc: 'AND9301019A1',
    email: 'contacto@almacenesnorte.mx',
    phone: '+52 81 8123 4567',
    address: 'Av. Industrias 3200, Col. Apodaca, Monterrey, Nuevo León, CP 66600',
  });
  await ensureContacto(cliente1.id, 'Lic. Ricardo Treviño', 'Director de Operaciones', '+52 81 8123 4568', 'rtrevino@almacenesnorte.mx');
  const contrato1 = await ensureContrato({ clientId: cliente1.id, number: 'CTR-2025-014', startDate: '2025-03-01', endDate: '2026-02-28' });
  const sitio1 = await ensureSitio({
    clientId: cliente1.id, name: 'CD Logístico Apodaca', address: 'Parque Industrial Apodaca, Manzana 14, Monterrey, NL',
    lat: 25.7706, lng: -100.1895, radio: 150, contactName: 'Lic. Ricardo Treviño', contactPhone: '+52 81 8123 4568', schedule: 'Lun-Dom 24 h',
  });
  await ensureServicio({ contractId: contrato1.id, siteId: sitio1.id, name: 'Vigilancia perimetral 24/7', guardCount: 4, tariff: 18500, cost: 14200, startDate: '2025-03-01' });
  const post1a = await ensurePost({ siteId: sitio1.id, name: 'Acceso Principal', s: '06:00', e: '18:00' });
  const post1b = await ensurePost({ siteId: sitio1.id, name: 'Rondín Nocturno', s: '18:00', e: '06:00' });

  // ---------- Cartera 2: Plaza Vía Dorada (Guadalajara, JAL) ----------
  const cliente2 = await ensureCliente({
    legalName: 'Inmobiliaria Vía Dorada S.A. de C.V.',
    commercialName: 'Plaza Vía Dorada',
    rfc: 'IVD950808M34',
    email: 'administracion@viadorada.mx',
    phone: '+52 33 3612 8877',
    address: 'Av. Vallarta 4100, Zapopan, Guadalajara, Jalisco, CP 45010',
  });
  await ensureContacto(cliente2.id, 'Ing. Sofía Camarena', 'Administradora', '+52 33 3612 8878', 'scamarena@viadorada.mx');
  const contrato2 = await ensureContrato({ clientId: cliente2.id, number: 'CTR-2025-021', startDate: '2025-06-15', endDate: '2026-06-14' });
  const sitio2 = await ensureSitio({
    clientId: cliente2.id, name: 'Plaza Comercial Vía Dorada', address: 'Av. Vallarta 4100, Zapopan, Jalisco',
    lat: 20.6984, lng: -103.4182, radio: 120, contactName: 'Ing. Sofía Camarena', contactPhone: '+52 33 3612 8878', schedule: 'Lun-Dom 07:00-22:00',
  });
  await ensureServicio({ contractId: contrato2.id, siteId: sitio2.id, name: 'Vigilancia comercial diurna', guardCount: 3, tariff: 14200, cost: 11000, startDate: '2025-06-15' });
  const post2a = await ensurePost({ siteId: sitio2.id, name: 'Acceso Estacionamiento', s: '07:00', e: '15:00' });
  const post2b = await ensurePost({ siteId: sitio2.id, name: 'Acceso Plaza', s: '15:00', e: '23:00' });

  // ---------- Cartera 3: Hospital San Rafael (CDMX) ----------
  const cliente3 = await ensureCliente({
    legalName: 'Hospital San Rafael S.A. de C.V.',
    commercialName: 'Hospital San Rafael',
    rfc: 'HSR861212AB7',
    email: 'ops@hospital-sanrafael.mx',
    phone: '+52 55 5510 2233',
    address: 'Calz. de Tlalpan 2800, Col. Satélite, Ciudad de México, CP 08890',
  });
  await ensureContacto(cliente3.id, 'Dra. Elena Rangel', 'Directora Médica', '+52 55 5510 2240', 'erangel@hospital-sanrafael.mx');
  const contrato3 = await ensureContrato({ clientId: cliente3.id, number: 'CTR-2026-002', startDate: '2026-01-01', endDate: '2026-12-31' });
  const sitio3 = await ensureSitio({
    clientId: cliente3.id, name: 'Hospital San Rafael', address: 'Calz. de Tlalpan 2800, CDMX',
    lat: 19.3158, lng: -99.1642, radio: 100, contactName: 'Dra. Elena Rangel', contactPhone: '+52 55 5510 2240', schedule: 'Lun-Dom 24 h',
  });
  await ensureServicio({ contractId: contrato3.id, siteId: sitio3.id, name: 'Vigilancia institucional 24/7', guardCount: 2, tariff: 17600, cost: 13500, startDate: '2026-01-01' });
  const post3a = await ensurePost({ siteId: sitio3.id, name: 'Acceso Urgencias', s: '00:00', e: '12:00' });
  const post3b = await ensurePost({ siteId: sitio3.id, name: 'Rondín Hospital', s: '12:00', e: '00:00' });

  // ---------- Cartera 4: Metal Mecánica Querétaro ----------
  const cliente4 = await ensureCliente({
    legalName: 'Industrias Metal Mecánicas del Bajío S.A. de C.V.',
    commercialName: 'Metal Mecánica Bajío',
    rfc: 'IMB780630C45',
    email: 'admin@metalmecbajio.mx',
    phone: '+52 442 214 5566',
    address: 'Libramiento Nororiente 900, Querétaro, Qro., CP 76220',
  });
  await ensureContacto(cliente4.id, 'Mtro. Óscar Peña', 'Gerente de Planta', '+52 442 214 5567', 'opena@metalmecbajio.mx');
  const contrato4 = await ensureContrato({ clientId: cliente4.id, number: 'CTR-2025-038', startDate: '2025-09-01', endDate: '2026-08-31' });
  const sitio4 = await ensureSitio({
    clientId: cliente4.id, name: 'Planta Querétaro', address: 'Libramiento Nororiente 900, Querétaro, Qro.',
    lat: 20.6392, lng: -100.3994, radio: 200, contactName: 'Mtro. Óscar Peña', contactPhone: '+52 442 214 5567', schedule: 'Lun-Sáb 06:00-22:00',
  });
  await ensureServicio({ contractId: contrato4.id, siteId: sitio4.id, name: 'Vigilancia industrial turnos', guardCount: 3, tariff: 19800, cost: 15200, startDate: '2025-09-01' });
  const post4a = await ensurePost({ siteId: sitio4.id, name: 'Acceso Principal', s: '06:00', e: '18:00' });
  const post4b = await ensurePost({ siteId: sitio4.id, name: 'Caseta #2', s: '18:00', e: '06:00' });

  // ---------- Guardias demo (asignados por cliente) ----------
  const guardias = [
    { emp: 'GU-101', nom: 'Jorge Armando', ape: 'Salinas', ape2: 'Ríos', tel: '+52 81 2000 1011', dir: 'Col. Apodaca, NL', curp: 'SARA900101HNLLRR01', rfc: 'SARJ9001019A1', nss: '81990001011', fecha: '2025-02-10', zona: zonaNorteId, cliente: cliente1.id },
    { emp: 'GU-102', nom: 'Luis Fernando', ape: 'Castro', ape2: 'Medina', tel: '+52 81 2000 1022', dir: 'Col. Guadalupe, NL', curp: 'CAMLU880515HNLTSR02', rfc: 'CASL880515M34', nss: '81880005152', fecha: '2025-02-10', zona: zonaNorteId, cliente: cliente1.id },
    { emp: 'GU-103', nom: 'Ana Patricia', ape: 'Durán', ape2: 'Garza', tel: '+52 81 2000 1033', dir: 'Col. Anáhuac, NL', curp: 'DUGA920322MNLRRN03', rfc: 'DUGA9203229A1', nss: '81920003223', fecha: '2025-03-01', zona: zonaNorteId, cliente: cliente1.id },
    { emp: 'GU-201', nom: 'Miguel Ángel', ape: 'Rojas', ape2: 'Vega', tel: '+52 33 2500 2011', dir: 'Zapopan, Jalisco', curp: 'ROVM890624HJCGGL04', rfc: 'ROVM890624M34', nss: '33890006244', fecha: '2025-06-15', zona: zonaOccidenteId, cliente: cliente2.id },
    { emp: 'GU-202', nom: 'Karla Yazmín', ape: 'Flores', ape2: 'Cruz', tel: '+52 33 2500 2022', dir: 'Guadalajara, Jalisco', curp: 'FOCJ950812MJLCNR05', rfc: 'FOCJ950812M34', nss: '339500081', fecha: '2025-06-20', zona: zonaOccidenteId, cliente: cliente2.id },
    { emp: 'GU-301', nom: 'Ricardo', ape: 'Mendoza', ape2: 'Torres', tel: '+52 55 3000 3011', dir: 'Col. Satélite, CDMX', curp: 'METR870430HDFNRR06', rfc: 'METR8704309A1', nss: '548700043', fecha: '2025-12-01', zona: zonaBajioId, cliente: cliente3.id },
    { emp: 'GU-302', nom: 'Valentina', ape: 'Ortiz', ape2: 'Saucedo', tel: '+52 55 3000 3022', dir: 'Col. Portales, CDMX', curp: 'OISV930715MDFRCL07', rfc: 'OISV9307159A1', nss: '549300071', fecha: '2025-12-01', zona: zonaBajioId, cliente: cliente3.id },
    { emp: 'GU-401', nom: 'Héctor', ape: 'Navarro', ape2: 'Lozano', tel: '+52 442 400 4011', dir: 'Querétaro, Qro.', curp: 'NALH860905HQTRZR08', rfc: 'NALH860905C45', nss: '228600090', fecha: '2025-09-01', zona: zonaBajioId, cliente: cliente4.id },
    { emp: 'GU-402', nom: 'Dulce María', ape: 'Espinoza', ape2: 'Ramos', tel: '+52 442 400 4022', dir: 'Querétaro, Qro.', curp: 'EIRD940318MQTRMN09', rfc: 'EIRD940318C45', nss: '229400031', fecha: '2025-09-05', zona: zonaBajioId, cliente: cliente4.id },
  ];

  const guardIds: Record<string, string> = {};
  for (const g of guardias) {
    guardIds[g.emp] = await ensureGuardia(g, changedById?.id);
  }

  // ---------- Turnos de hoy ----------
  await ensureTurno(guardIds['GU-101'], post1a.id, servicioIdDe(post1a.id), '06:00', '18:00');
  await ensureTurno(guardIds['GU-102'], post1b.id, servicioIdDe(post1b.id), '18:00', '06:00');
  await ensureTurno(guardIds['GU-103'], post1b.id, servicioIdDe(post1b.id), '18:00', '06:00');
  await ensureTurno(guardIds['GU-201'], post2a.id, servicioIdDe(post2a.id), '07:00', '15:00');
  await ensureTurno(guardIds['GU-202'], post2b.id, servicioIdDe(post2b.id), '15:00', '23:00');
  await ensureTurno(guardIds['GU-301'], post3a.id, servicioIdDe(post3a.id), '00:00', '12:00');
  await ensureTurno(guardIds['GU-302'], post3b.id, servicioIdDe(post3b.id), '12:00', '00:00');
  await ensureTurno(guardIds['GU-401'], post4a.id, servicioIdDe(post4a.id), '06:00', '18:00');
  await ensureTurno(guardIds['GU-402'], post4b.id, servicioIdDe(post4b.id), '18:00', '06:00');

  // ---------- Inventario demo ----------
  const inventario = {
    radio: await ensureInventario('radio', 'RAD-GS-0001', 'Motorola XPR 3500'),
    chaleco: await ensureInventario('chaleco', 'CHL-GS-0001', 'Chaleco balístico Nivel IIIA'),
    lamp: await ensureInventario('lámpara', 'LMP-GS-0001', 'Lámpara LED táctica'),
    camara: await ensureInventario('cámara', 'CAM-GS-0001', 'Cámara corporal'),
    uniforme: await ensureInventario('uniforme', 'UNI-GS-0001', 'Uniforme operativo Talla M'),
  };
  await ensureInventario('celular', 'CEL-GS-0001', 'Smartphone corporativo');

  await ensureAsignacion(inventario.radio.id, guardIds['GU-101'], 'Radios de comunicación por turno');
  await ensureAsignacion(inventario.chaleco.id, guardIds['GU-201'], 'Chaleco balístico para acceso plaza');
  await ensureAsignacion(inventario.lamp.id, guardIds['GU-102'], 'Lámpara para rondín nocturno');
  await ensureAsignacion(inventario.camara.id, guardIds['GU-301'], 'Cámara corporal');
  await ensureAsignacion(inventario.uniforme.id, guardIds['GU-401'], 'Uniforme operativo');

  console.log('Datos de presentación cargados:');
  console.log('  Clientes: Almacenes del Norte (NL), Plaza Vía Dorada (JAL), Hospital San Rafael (CDMX), Metal Mecánica Bajío (QRO)');
  console.log(`  Guardias demo: ${Object.keys(guardIds).length} (GU-101..GU-402)`);
  console.log('  Turnos de hoy: 9');
  console.log('  Inventario: 6 artículos, 5 asignados');

  await prisma.$disconnect();
}

// ============ Helpers idempotentes ============

async function ensureZone(name: string, description: string): Promise<string> {
  const existing = await prisma.zone.findFirst({ where: { companyId: COMPANY_A, name } });
  if (existing) return existing.id;
  const created = await prisma.zone.create({ data: { companyId: COMPANY_A, name, description } });
  return created.id;
}

async function ensureCliente(d: any) {
  let c = await prisma.client.findFirst({ where: { companyId: COMPANY_A, commercialName: d.commercialName } });
  if (!c) {
    c = await prisma.client.create({ data: { companyId: COMPANY_A, ...d } });
  }
  return c;
}

async function ensureContacto(clientId: string, name: string, position: string, phone: string, email: string) {
  const existing = await prisma.clientContact.findFirst({ where: { clientId, email } });
  if (existing) return;
  await prisma.clientContact.create({ data: { clientId, name, position, phone, email, isPrimary: true } });
}

async function ensureContrato(d: any) {
  const existing = await prisma.contract.findUnique({ where: { companyId_number: { companyId: COMPANY_A, number: d.number } } });
  if (existing) return existing;
  return prisma.contract.create({
    data: {
      companyId: COMPANY_A, clientId: d.clientId, number: d.number,
      startDate: new Date(d.startDate), endDate: new Date(d.endDate),
      billingFrequency: 'mensual', status: 'activo',
    },
  });
}

async function ensureSitio(d: any) {
  const existing = await prisma.site.findFirst({ where: { clientId: d.clientId, name: d.name } });
  if (existing) return existing;
  return prisma.site.create({
    data: {
      clientId: d.clientId, name: d.name, address: d.address,
      latitude: d.lat, longitude: d.lng, geofenceRadiusMeters: d.radio,
      contactName: d.contactName, contactPhone: d.contactPhone, schedule: d.schedule,
    },
  });
}

async function ensureServicio(d: any) {
  const existing = await prisma.contractService.findFirst({ where: { contractId: d.contractId, siteId: d.siteId, name: d.name } });
  if (existing) return existing;
  return prisma.contractService.create({
    data: {
      contractId: d.contractId, siteId: d.siteId, name: d.name,
      guardCount: d.guardCount, tariff: d.tariff, estimatedCost: d.cost,
      startDate: new Date(d.startDate), active: true,
    },
  });
}

async function ensurePost(d: any) {
  const existing = await prisma.post.findFirst({ where: { siteId: d.siteId, name: d.name } });
  if (existing) return existing;
  return prisma.post.create({ data: { siteId: d.siteId, name: d.name, shiftStart: d.s, shiftEnd: d.e, active: true } });
}

const servicioIdCache = new Map<string, string>();

async function servicioIdDe(postId: string): Promise<string | null> {
  if (servicioIdCache.has(postId)) return servicioIdCache.get(postId) ?? null;
  const post = await prisma.post.findUnique({ where: { id: postId }, include: { site: { include: { services: { where: { active: true } } } } } });
  const serviceId = post?.site.services[0]?.id ?? null;
  servicioIdCache.set(postId, serviceId ?? '');
  return serviceId;
}

async function ensureGuardia(g: any, changedById?: string): Promise<string> {
  const existing = await prisma.guard.findUnique({ where: { employeeNumber: g.emp } });
  if (existing) return existing.id;
  const guard = await prisma.guard.create({
    data: {
      companyId: COMPANY_A, employeeNumber: g.emp, firstName: g.nom, lastName: g.ape,
      secondLastName: g.ape2, phone: g.tel, address: g.dir, curp: g.curp, rfc: g.rfc,
      nss: g.nss, hireDate: new Date(g.fecha), status: 'asignado', zoneId: g.zona, assignedClientId: g.cliente,
    },
  });
  if (changedById) {
    await prisma.guardAssignment.create({
      data: {
        companyId: COMPANY_A, guardId: guard.id, fromClientId: null, toClientId: g.cliente,
        changedById, reason: 'Asignación inicial de la carga de datos demo',
      },
    }).catch(() => undefined);
  }
  return guard.id;
}

async function ensureTurno(guardId: string, postId: string, serviceId: string | null, s: string, e: string) {
  const existing = await prisma.shift.findFirst({ where: { guardId, postId, date: hoje(), startTime: s } });
  if (existing) return;
  await prisma.shift.create({ data: { guardId, postId, serviceId, date: hoje(), startTime: s, endTime: e, status: 'programado' } }).catch(() => undefined);
}

async function ensureInventario(type: string, serial: string, brand: string) {
  const existing = await prisma.inventoryItem.findFirst({ where: { companyId: COMPANY_A, serialNumber: serial } });
  if (existing) return existing;
  return prisma.inventoryItem.create({ data: { companyId: COMPANY_A, type, serialNumber: serial, brand, status: 'disponible' } });
}

async function ensureAsignacion(itemId: string, guardId: string, notes: string) {
  const existing = await prisma.inventoryAssignment.findFirst({ where: { itemId, returnedDate: null } });
  if (existing) return;
  await prisma.inventoryAssignment.create({ data: { itemId, guardId, assignedDate: new Date(), notes } });
}

main().catch(async (e) => {
  console.error('Error en datos de presentación:', e);
  await prisma.$disconnect();
  process.exit(1);
});