import {
  loginSchema,
  changePasswordSchema,
  createUserSchema,
  contractSchema,
  guardSchema,
  attendanceSchema,
  incidentSchema,
  vehicleSchema,
} from './schemas';

describe('loginSchema', () => {
  it('acepta credenciales válidas', () => {
    const r = loginSchema.safeParse({ email: 'admin@gruposervicom.com', password: 'Admin123!' });
    expect(r.success).toBe(true);
  });

  it('rechaza email inválido', () => {
    const r = loginSchema.safeParse({ email: 'no-un-email', password: 'x' });
    expect(r.success).toBe(false);
  });

  it('rechaza contraseña vacía', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: '' });
    expect(r.success).toBe(false);
  });
});

describe('passwordSchema (vía changePasswordSchema)', () => {
  it('rechaza contraseña sin mayúscula', () => {
    const r = changePasswordSchema.safeParse({ currentPassword: 'ok', newPassword: 'abcde1' });
    expect(r.success).toBe(false);
  });

  it('rechaza contraseña muy corta', () => {
    const r = changePasswordSchema.safeParse({ currentPassword: 'ok', newPassword: 'Ab1' });
    expect(r.success).toBe(false);
  });

  it('rechaza contraseña sin número', () => {
    const r = changePasswordSchema.safeParse({ currentPassword: 'ok', newPassword: 'Abcdefgh' });
    expect(r.success).toBe(false);
  });
});

describe('createUserSchema', () => {
  it('acepta un usuario válido', () => {
    const r = createUserSchema.safeParse({
      name: 'Juan',
      lastName: 'Pérez',
      email: 'juan@gruposervicom.com',
      password: 'Pass1234',
      roleCode: 'ADMINISTRATOR',
    });
    expect(r.success).toBe(true);
  });

  it('rechaza email inválido', () => {
    const r = createUserSchema.safeParse({
      name: 'Juan',
      lastName: 'Pérez',
      email: 'malo',
      password: 'Pass1234',
      roleCode: 'ADMINISTRATOR',
    });
    expect(r.success).toBe(false);
  });
});

describe('contractSchema', () => {
  it('rechaza clientId que no es UUID', () => {
    const r = contractSchema.safeParse({
      clientId: 'no-es-uuid',
      number: 'CTR-001',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    expect(r.success).toBe(false);
  });

  it('acepta un contrato válido con UUID', () => {
    const r = contractSchema.safeParse({
      clientId: 'c0000001-0000-4000-8000-000000000001',
      number: 'CTR-001',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    expect(r.success).toBe(true);
  });
});

describe('guardSchema', () => {
  const base = {
    employeeNumber: 'GU-001',
    firstName: 'Carlos',
    lastName: 'Ramirez',
    curp: '',
    rfc: '',
    nss: '',
    phone: '5551234567',
    email: '',
    address: 'Calle 1',
    hireDate: '2026-01-01',
    status: 'disponible',
  };

  it('acepta un guardia válido sin CURP/RFC', () => {
    const r = guardSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it('rechaza CURP con formato inválido', () => {
    const r = guardSchema.safeParse({ ...base, curp: 'XXXX' });
    expect(r.success).toBe(false);
  });

  it('rechaza RFC con formato inválido', () => {
    const r = guardSchema.safeParse({ ...base, rfc: 'abc123' });
    expect(r.success).toBe(false);
  });
});

describe('attendanceSchema', () => {
  it('acepta entrada/salida con coordenadas', () => {
    const ok = attendanceSchema.safeParse({ type: 'entrada', latitude: 19.43, longitude: -99.13 });
    expect(ok.success).toBe(true);
  });

  it('rechaza tipo inválido', () => {
    const bad = attendanceSchema.safeParse({ type: 'medio_dia', latitude: 1, longitude: 2 });
    expect(bad.success).toBe(false);
  });
});

describe('incidentSchema', () => {
  it('rechaza severidad inválida', () => {
    const r = incidentSchema.safeParse({ type: 'robo', severity: 'muy_alta', description: 'explicación suficiente' });
    expect(r.success).toBe(false);
  });

  it('acepta incidencia válida', () => {
    const r = incidentSchema.safeParse({ type: 'robo', severity: 'alta', description: 'explicación suficiente' });
    expect(r.success).toBe(true);
  });
});

describe('vehicleSchema', () => {
  it('acepta vehículo válido usando plates (campo correcto)', () => {
    const r = vehicleSchema.safeParse({ brand: 'Toyota', model: 'Hilux', plates: 'ABC-123' });
    expect(r.success).toBe(true);
  });

  it('rechaza factura si falta plates', () => {
    const r = vehicleSchema.safeParse({ brand: 'Toyota', model: 'Hilux' });
    expect(r.success).toBe(false);
  });
});