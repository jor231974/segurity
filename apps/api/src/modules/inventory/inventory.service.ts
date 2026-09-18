import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: AuthUser, query: { type?: string; status?: string; search?: string }) {
    const where: any = { companyId: user.companyId };
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.search?.trim()) {
      const t = query.search.trim();
      where.OR = [
        { serialNumber: { contains: t, mode: 'insensitive' } },
        { brand: { contains: t, mode: 'insensitive' } },
      ];
    }
    return this.prisma.inventoryItem.findMany({
      where,
      include: {
        assignments: { where: { returnedDate: null }, include: { guard: { select: { id: true, firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: { assignments: { include: { guard: true }, orderBy: { assignedDate: 'desc' } } },
    });
    if (!item) throw new NotFoundException('Equipo no encontrado');
    if (item.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    return item;
  }

  async create(user: AuthUser, body: any) {
    if (!user.companyId) throw new BadRequestException('Sin empresa asociada');
    if (!body.serialNumber) throw new BadRequestException('Número de serie requerido');
    const exists = await this.prisma.inventoryItem.findUnique({
      where: { companyId_serialNumber: { companyId: user.companyId, serialNumber: body.serialNumber } },
    });
    if (exists) throw new BadRequestException('Ya existe un equipo con ese número de serie');
    return this.prisma.inventoryItem.create({
      data: {
        companyId: user.companyId,
        type: body.type,
        serialNumber: body.serialNumber,
        brand: body.brand,
        status: body.status || 'disponible',
        notes: body.notes,
      },
    });
  }

  async update(user: AuthUser, id: string, body: any) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Equipo no encontrado');
    if (item.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    return this.prisma.inventoryItem.update({ where: { id }, data: {
      ...(body.type && { type: body.type }),
      ...(body.serialNumber && { serialNumber: body.serialNumber }),
      ...(body.brand !== undefined && { brand: body.brand }),
      ...(body.status && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
    } });
  }

  async remove(user: AuthUser, id: string) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Equipo no encontrado');
    if (item.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    return this.prisma.inventoryItem.update({ where: { id }, data: { status: 'baja' } });
  }

  async assign(user: AuthUser, id: string, body: any) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Equipo no encontrado');
    if (item.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    if (item.status === 'asignado') throw new BadRequestException('El equipo ya está asignado');

    if (body.guardId) {
      const guard = await this.prisma.guard.findFirst({ where: { id: body.guardId, companyId: user.companyId } });
      if (!guard) throw new NotFoundException('Guardia no encontrado');
    }

    await this.prisma.$transaction([
      this.prisma.inventoryAssignment.create({
        data: { itemId: id, guardId: body.guardId || null, assignedDate: body.assignedDate ? new Date(body.assignedDate) : new Date(), notes: body.notes },
      }),
      this.prisma.inventoryItem.update({ where: { id }, data: { status: 'asignado' } }),
    ]);
    return this.findOne(user, id);
  }

  async returnItem(user: AuthUser, assignmentId: string) {
    const assignment = await this.prisma.inventoryAssignment.findUnique({ where: { id: assignmentId }, include: { item: true } });
    if (!assignment) throw new NotFoundException('Asignación no encontrada');
    if (assignment.item.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    if (assignment.returnedDate) throw new BadRequestException('Ya fue devuelto');

    await this.prisma.$transaction([
      this.prisma.inventoryAssignment.update({ where: { id: assignmentId }, data: { returnedDate: new Date() } }),
      this.prisma.inventoryItem.update({ where: { id: assignment.itemId }, data: { status: 'disponible' } }),
    ]);
    return { message: 'Equipo devuelto' };
  }
}