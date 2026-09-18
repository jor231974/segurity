import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser, search?: string) {
    const where: any = { companyId: user.companyId, deletedAt: null };
    if (search?.trim()) {
      const t = search.trim();
      where.OR = [
        { plates: { contains: t, mode: 'insensitive' } },
        { brand: { contains: t, mode: 'insensitive' } },
        { model: { contains: t, mode: 'insensitive' } },
      ];
    }
    return this.prisma.vehicle.findMany({
      where,
      include: { responsibleGuard: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async expiringInsurance(user: AuthUser, days: string) {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + (parseInt(days) || 30));
    return this.prisma.vehicle.findMany({
      where: { companyId: user.companyId ?? undefined, insuranceExpiration: { not: null, lte: maxDate }, deletedAt: null },
      include: { responsibleGuard: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { insuranceExpiration: 'asc' },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const v = await this.prisma.vehicle.findUnique({ where: { id }, include: { responsibleGuard: true } });
    if (!v || v.deletedAt) throw new NotFoundException('Vehículo no encontrado');
    if (v.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    return v;
  }

  async create(user: AuthUser, body: any) {
    if (!user.companyId) throw new BadRequestException('Sin empresa asociada');
    if (!body.brand || !body.model || !body.plates) throw new BadRequestException('Marca, modelo y placas requeridos');
    return this.prisma.vehicle.create({
      data: {
        companyId: user.companyId,
        brand: body.brand,
        model: body.model,
        plates: body.plates,
        year: body.year,
        vin: body.vin,
        insuranceExpiration: body.insuranceExpiration ? new Date(body.insuranceExpiration) : null,
        responsibleGuardId: body.responsibleGuardId,
        notes: body.notes,
      },
    });
  }

  async update(user: AuthUser, id: string, body: any) {
    const v = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!v) throw new NotFoundException('Vehículo no encontrado');
    if (v.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    return this.prisma.vehicle.update({ where: { id }, data: {
      ...(body.brand && { brand: body.brand }),
      ...(body.model && { model: body.model }),
      ...(body.year !== undefined && { year: body.year }),
      ...(body.plates && { plates: body.plates }),
      ...(body.vin !== undefined && { vin: body.vin }),
      ...(body.insuranceExpiration !== undefined && { insuranceExpiration: body.insuranceExpiration ? new Date(body.insuranceExpiration) : null }),
      ...(body.currentMileage !== undefined && { currentMileage: body.currentMileage }),
      ...(body.responsibleGuardId !== undefined && { responsibleGuardId: body.responsibleGuardId || null }),
      ...(body.notes !== undefined && { notes: body.notes }),
    } });
  }

  async remove(user: AuthUser, id: string) {
    const v = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!v) throw new NotFoundException('Vehículo no encontrado');
    if (v.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    return this.prisma.vehicle.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
