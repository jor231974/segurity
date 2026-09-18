import { PrismaClient } from '@prisma/client';

/**
 * Fecha local (YYYY-MM-DD) para evitar desfases por la frontera UTC.
 */
export function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** True si el turno cruza la medianoche (termina al día siguiente). */
export function crossesMidnight(shift: { startTime: string; endTime: string }): boolean {
  return toMinutes(shift.endTime) <= toMinutes(shift.startTime);
}

/**
 * Busca el turno "de hoy" del guardia: primero el programado/activo con fecha de hoy
 * y, si no existe, el turno nocturno del día anterior que aún no termina
 * (p. ej. rondín 19:00 a 07:00 que cruza la medianoche).
 */
export async function findCurrentShift(
  prisma: PrismaClient,
  guardId: string,
  now: Date = new Date(),
) {
  const todayStr = localDateStr(now);
  const todayMidnight = new Date(todayStr + 'T00:00:00.000Z');
  const baseInclude = { post: { include: { site: true } } };

  const todayShift = await prisma.shift.findFirst({
    where: {
      guardId,
      date: todayMidnight,
      status: { in: ['programado', 'activo'] },
    },
    include: baseInclude,
    orderBy: { startTime: 'asc' },
  });
  if (todayShift) return todayShift;

  // Turno nocturno del día anterior que cruza medianoche y que sigue en curso.
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = localDateStr(yesterday);
  const yesterdayMidnight = new Date(yesterdayStr + 'T00:00:00.000Z');
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const yesterdayShifts = await prisma.shift.findMany({
    where: {
      guardId,
      date: yesterdayMidnight,
      status: { in: ['programado', 'activo'] },
    },
    include: baseInclude,
    orderBy: { startTime: 'asc' },
  });

  if (yesterdayShifts.length === 0) return null;

  return (
    yesterdayShifts.find((s) => crossesMidnight(s) && nowMinutes < toMinutes(s.endTime)) ??
    null
  );
}