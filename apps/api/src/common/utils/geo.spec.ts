import { haversineDistanceKm, isInsideGeofence } from './geo';

describe('haversineDistanceKm', () => {
  it('devuelve 0 para el mismo punto', () => {
    const d = haversineDistanceKm(19.4326, -99.1332, 19.4326, -99.1332);
    expect(d).toBe(0);
  });

  it('calcula la distancia CDMX - Guadalajara (~460 km)', () => {
    const d = haversineDistanceKm(19.4326, -99.1332, 20.6597, -103.3496);
    expect(d).toBeGreaterThan(440);
    expect(d).toBeLessThan(490);
  });

  it('es simétrica', () => {
    const a = haversineDistanceKm(19.4326, -99.1332, 25.6866, -100.3161);
    const b = haversineDistanceKm(25.6866, -100.3161, 19.4326, -99.1332);
    expect(a).toBeCloseTo(b, 10);
  });
});

describe('isInsideGeofence', () => {
  const siteLat = 19.4326;
  const siteLon = -99.1332;

  it('true si el punto está dentro del radio', () => {
    expect(isInsideGeofence(19.4327, -99.1333, siteLat, siteLon, 100)).toBe(true);
  });

  it('true si el punto está en el borde exacto', () => {
    // ~84 m dentro de radio 100 m
    expect(isInsideGeofence(19.4334, -99.1332, siteLat, siteLon, 100)).toBe(true);
  });

  it('false si el punto está fuera del radio', () => {
    // ~1 km
    expect(isInsideGeofence(19.4416, -99.1332, siteLat, siteLon, 100)).toBe(false);
  });

  it('true si el sitio no tiene geocerca definida (0/undefined)', () => {
    expect(isInsideGeofence(19.4326, -99.1332, 0, 0, 100)).toBe(true);
  });
});