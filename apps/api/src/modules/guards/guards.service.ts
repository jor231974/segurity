import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class GuardsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAccess(user: AuthUser, companyId: string | null) {
    if (!user.companyId) throw new ForbiddenException('Sin empresa asociada');
    if (companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Acceso denegado');
    }
  }

  async findAll(user: AuthUser, query: { page: string; limit: string; search?: string; status?: string; zoneId?: string; clientId?: string }) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const where: any = { companyId: user.companyId, deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.zoneId) where.zoneId = query.zoneId;
    if (query.clientId) where.assignedClientId = query.clientId;

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { employeeNumber: { contains: term, mode: 'insensitive' } },
        { curp: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.guard.count({ where }),
      this.prisma.guard.findMany({
        where,
        include: {
          zone: true,
          assignedClient: { select: { id: true, commercialName: true, legalName: true } },
          supervisor: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { shifts: { where: { status: 'activo' } }, documents: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { hireDate: 'desc' },
      }),
    ]);
    return { total, page, limit, items };
  }

  async findByUserId(user: AuthUser) {
    if (!user.guardId) throw new NotFoundException('El usuario no está vinculado a un guardia');
    const guard = await this.prisma.guard.findUnique({
      where: { id: user.guardId },
      include: {
        zone: true,
        documents: true,
        trainings: true,
        shifts: {
          where: { status: { in: ['programado', 'activo'] } },
          include: { post: { include: { site: true } } },
          orderBy: { date: 'asc' },
        },
      },
    });
    return guard;
  }

  async findOne(user: AuthUser, id: string) {
    const guard = await this.prisma.guard.findUnique({
      where: { id },
      include: {
        zone: true,
        assignedClient: { select: { id: true, commercialName: true, legalName: true } },
        supervisor: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        documents: { orderBy: { createdAt: 'desc' } },
        trainings: { orderBy: { trainingDate: 'desc' } },
        shifts: { include: { post: { include: { site: true } } }, orderBy: { date: 'desc' } },
        vehicles: { where: { deletedAt: null } },
        inventoryAssignments: { include: { item: true } },
      },
    });
    if (!guard || guard.deletedAt) throw new NotFoundException('Guardia no encontrado');
    await this.assertAccess(user, guard.companyId);
    return guard;
  }

  async create(user: AuthUser, body: any) {
    if (!user.companyId) throw new BadRequestException('Sin empresa asociada');

    const exists = await this.prisma.guard.findUnique({
      where: { employeeNumber: body.employeeNumber },
    });
    if (exists) throw new BadRequestException('Ya existe un guardia con ese número de empleado');

    let assignedClientId: string | undefined;
    if (body.assignedClientId) {
      const client = await this.prisma.client.findFirst({
        where: { id: body.assignedClientId, companyId: user.companyId, deletedAt: null },
      });
      if (!client) throw new BadRequestException('El cliente asignado no existe o no pertenece a tu empresa');
      assignedClientId = client.id;
    }

    let userId: string | undefined;
    if (body.email) {
      const passwordHash = await bcrypt.hash('Guardia123!', 12);
      const existingUser = await this.prisma.user.findUnique({ where: { email: body.email.toLowerCase().trim() } });
      if (existingUser) {
        throw new BadRequestException('Ya existe un usuario con ese correo');
      }
      const role = await this.prisma.role.findUnique({ where: { code: 'GUARD' } });
      const newUser = await this.prisma.user.create({
        data: {
          companyId: user.companyId,
          email: body.email.toLowerCase().trim(),
          passwordHash,
          name: body.firstName,
          lastName: body.lastName,
          mustChangePassword: true,
          userRoles: role ? { create: { roleId: role.id } } : undefined,
        },
      });
      userId = newUser.id;
    }

    const guard = await this.prisma.guard.create({
      data: {
        companyId: user.companyId,
        employeeNumber: body.employeeNumber,
        userId,
        firstName: body.firstName,
        middleName: body.middleName,
        lastName: body.lastName,
        secondLastName: body.secondLastName,
        photoUrl: body.photoUrl,
        curp: body.curp,
        rfc: body.rfc,
        nss: body.nss,
        phone: body.phone,
        email: body.email?.toLowerCase().trim(),
        address: body.address,
        emergencyContactName: body.emergencyContactName,
        emergencyContactPhone: body.emergencyContactPhone,
        hireDate: new Date(body.hireDate),
        status: body.status || 'disponible',
        zoneId: body.zoneId,
        supervisorId: body.supervisorId,
        assignedClientId,
      },
      include: {
        zone: true,
        assignedClient: { select: { id: true, commercialName: true, legalName: true } },
        supervisor: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (assignedClientId) {
      await this.prisma.guardAssignment.create({
        data: {
          companyId: user.companyId,
          guardId: guard.id,
          fromClientId: null,
          toClientId: assignedClientId,
          changedById: user.id,
          reason: body.assignmentReason || 'Asignación inicial al crear el guardia',
        },
      });
    }

    return guard;
  }

  async update(user: AuthUser, id: string, body: any) {
    const guard = await this.prisma.guard.findUnique({ where: { id } });
    if (!guard || guard.deletedAt) throw new NotFoundException('Guardia no encontrado');
    await this.assertAccess(user, guard.companyId);

    return this.prisma.guard.update({
      where: { id },
      data: {
        ...(body.firstName && { firstName: body.firstName }),
        ...(body.middleName !== undefined && { middleName: body.middleName }),
        ...(body.lastName && { lastName: body.lastName }),
        ...(body.secondLastName !== undefined && { secondLastName: body.secondLastName }),
        ...(body.photoUrl !== undefined && { photoUrl: body.photoUrl }),
        ...(body.curp !== undefined && { curp: body.curp }),
        ...(body.rfc !== undefined && { rfc: body.rfc }),
        ...(body.nss !== undefined && { nss: body.nss }),
        ...(body.phone && { phone: body.phone }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.address && { address: body.address }),
        ...(body.emergencyContactName !== undefined && { emergencyContactName: body.emergencyContactName }),
        ...(body.emergencyContactPhone !== undefined && { emergencyContactPhone: body.emergencyContactPhone }),
        ...(body.hireDate && { hireDate: new Date(body.hireDate) }),
        ...(body.status && { status: body.status }),
        ...(body.zoneId !== undefined && { zoneId: body.zoneId }),
        ...(body.supervisorId !== undefined && { supervisorId: body.supervisorId }),
      },
    });
  }

  async remove(user: AuthUser, id: string) {
    const guard = await this.prisma.guard.findUnique({ where: { id } });
    if (!guard) throw new NotFoundException('Guardia no encontrado');
    await this.assertAccess(user, guard.companyId);
    return this.prisma.guard.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async reassign(user: AuthUser, id: string, body: { clientId: string; reason?: string }) {
    const guard = await this.prisma.guard.findUnique({ where: { id } });
    if (!guard || guard.deletedAt) throw new NotFoundException('Guardia no encontrado');
    await this.assertAccess(user, guard.companyId);
    if (!user.companyId) throw new BadRequestException('Sin empresa asociada');
    const companyId: string = user.companyId;

    const client = await this.prisma.client.findFirst({
      where: { id: body.clientId, companyId: user.companyId, deletedAt: null },
    });
    if (!client) throw new BadRequestException('El cliente no existe o no pertenece a tu empresa');
    if (guard.assignedClientId === client.id) {
      throw new BadRequestException(`El guardia ya está asignado a ${client.commercialName || client.legalName}`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const shiftWhere: any = {
      guardId: guard.id,
      date: { gte: today },
      status: 'programado',
    };
    if (guard.assignedClientId) {
      shiftWhere.post = { site: { clientId: guard.assignedClientId } };
    }

    const futureShifts = await this.prisma.shift.findMany({
      where: shiftWhere,
      select: { id: true },
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      const g = await tx.guard.update({
        where: { id: guard.id },
        data: { assignedClientId: client.id },
        include: {
          assignedClient: { select: { id: true, commercialName: true, legalName: true } },
        },
      });

      await tx.guardAssignment.create({
        data: {
          companyId,
          guardId: guard.id,
          toClientId: client.id,
          changedById: user.id,
          reason: body.reason || 'Reasignación de cliente',
          ...(guard.assignedClientId ? { fromClientId: guard.assignedClientId } : {}),
        },
      });

      if (futureShifts.length > 0) {
        await tx.shift.updateMany({
          where: { id: { in: futureShifts.map((s) => s.id) } },
          data: {
            status: 'cancelado',
            notes: `Cancelado por reasignación de cliente${body.reason ? `: ${body.reason}` : ''}`,
          },
        });
      }

      return g;
    });

    return {
      ...updated,
      cancelledShifts: futureShifts.length,
      previousClientId: guard.assignedClientId,
    };
  }

  async getAssignments(user: AuthUser, id: string) {
    const guard = await this.prisma.guard.findUnique({ where: { id } });
    if (!guard) throw new NotFoundException('Guardia no encontrado');
    await this.assertAccess(user, guard.companyId);

    return this.prisma.guardAssignment.findMany({
      where: { guardId: id },
      include: {
        fromClient: { select: { id: true, commercialName: true, legalName: true } },
        toClient: { select: { id: true, commercialName: true, legalName: true } },
        changedBy: { select: { id: true, name: true, lastName: true } },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async getDocuments(user: AuthUser, id: string) {
    const guard = await this.prisma.guard.findUnique({ where: { id } });
    if (!guard) throw new NotFoundException('Guardia no encontrado');
    await this.assertAccess(user, guard.companyId);
    return this.prisma.guardDocument.findMany({
      where: { guardId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addDocument(user: AuthUser, id: string, body: any) {
    const guard = await this.prisma.guard.findUnique({ where: { id } });
    if (!guard) throw new NotFoundException('Guardia no encontrado');
    await this.assertAccess(user, guard.companyId);

    return this.prisma.guardDocument.create({
      data: {
        guardId: id,
        type: body.type,
        documentDate: new Date(body.documentDate),
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
        fileUrl: body.fileUrl,
        notes: body.notes,
        status: body.status || 'vigente',
      },
    });
  }

  async getTrainings(user: AuthUser, id: string) {
    const guard = await this.prisma.guard.findUnique({ where: { id } });
    if (!guard) throw new NotFoundException('Guardia no encontrado');
    await this.assertAccess(user, guard.companyId);
    return this.prisma.training.findMany({
      where: { guardId: id },
      orderBy: { trainingDate: 'desc' },
    });
  }

  async addTraining(user: AuthUser, id: string, body: any) {
    const guard = await this.prisma.guard.findUnique({ where: { id } });
    if (!guard) throw new NotFoundException('Guardia no encontrado');
    await this.assertAccess(user, guard.companyId);

    return this.prisma.training.create({
      data: {
        guardId: id,
        courseName: body.courseName,
        instructor: body.instructor,
        trainingDate: new Date(body.trainingDate),
        durationHours: body.durationHours,
        result: body.result || 'en_curso',
        score: body.score,
        certificateUrl: body.certificateUrl,
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
      },
    });
  }

  async getSubordinates(user: AuthUser, id: string) {
    const guard = await this.prisma.guard.findUnique({ where: { id } });
    if (!guard) throw new NotFoundException('Guardia no encontrado');
    await this.assertAccess(user, guard.companyId);
    return this.prisma.guard.findMany({
      where: { supervisorId: id, deletedAt: null },
      include: { zone: true },
    });
  }

  async getForMap(user: AuthUser) {
    const guards = await this.prisma.guard.findMany({
      where: { companyId: user.companyId ?? undefined, deletedAt: null },
      include: {
        zone: true,
        gpsLogs: { orderBy: { timestamp: 'desc' }, take: 1 },
        shifts: { where: { status: { in: ['programado', 'activo'] } }, include: { post: { include: { site: true } } }, take: 3 },
      },
    });
    return guards.map((g) => ({
      id: g.id,
      firstName: g.firstName,
      lastName: g.lastName,
      photoUrl: g.photoUrl,
      phone: g.phone,
      status: g.status,
      zone: g.zone,
      lastLocation: g.gpsLogs[0] || null,
      shifts: g.shifts,
    }));
  }
}