import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveCompany(trainingId: string) {
    const training = await this.prisma.training.findUnique({
      where: { id: trainingId },
      include: { guard: { select: { companyId: true } } },
    });
    return { training, companyId: training?.guard?.companyId ?? null };
  }

  private async assertAccess(user: AuthUser, companyId: string | null) {
    if (!user.companyId) throw new ForbiddenException('Sin empresa asociada');
    if (companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Acceso denegado');
    }
  }

  async findAll(user: AuthUser, guardId?: string) {
    const where: any = { guard: { companyId: user.companyId } };
    if (guardId) where.guardId = guardId;
    return this.prisma.training.findMany({
      where,
      include: { guard: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } } },
      orderBy: { trainingDate: 'desc' },
    });
  }

  async findExpiring(user: AuthUser, days: string) {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + parseInt(days) || 60);
    return this.prisma.training.findMany({
      where: {
        guard: { companyId: user.companyId ?? undefined },
        expirationDate: { not: null, lte: maxDate },
      },
      include: { guard: { select: { id: true, firstName: true, lastName: true, employeeNumber: true } } },
      orderBy: { expirationDate: 'asc' },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const training = await this.prisma.training.findUnique({
      where: { id },
      include: { guard: true },
    });
    if (!training) throw new NotFoundException('Capacitación no encontrada');
    await this.assertAccess(user, training.guard.companyId);
    return training;
  }

  async create(user: AuthUser, body: any) {
    if (!body.guardId || !body.courseName || !body.instructor || body.durationHours === undefined) {
      throw new BadRequestException('guardId, courseName, instructor y durationHours son requeridos');
    }
    const trainingDate = new Date(body.trainingDate);
    if (isNaN(trainingDate.getTime())) throw new BadRequestException('trainingDate inválida');
    const guard = await this.prisma.guard.findUnique({ where: { id: body.guardId } });
    if (!guard || guard.deletedAt) throw new NotFoundException('Guardia no encontrado');
    await this.assertAccess(user, guard.companyId);

    return this.prisma.training.create({
      data: {
        guardId: body.guardId,
        courseName: body.courseName,
        instructor: body.instructor,
        trainingDate,
        durationHours: body.durationHours,
        result: body.result || 'en_curso',
        score: body.score,
        certificateUrl: body.certificateUrl,
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
      },
    });
  }

  async update(user: AuthUser, id: string, body: any) {
    const { training, companyId } = await this.resolveCompany(id);
    if (!training) throw new NotFoundException('Capacitación no encontrada');
    await this.assertAccess(user, companyId);

    return this.prisma.training.update({
      where: { id },
      data: {
        ...(body.courseName && { courseName: body.courseName }),
        ...(body.instructor && { instructor: body.instructor }),
        ...(body.trainingDate && { trainingDate: new Date(body.trainingDate) }),
        ...(body.durationHours && { durationHours: body.durationHours }),
        ...(body.result && { result: body.result }),
        ...(body.score !== undefined && { score: body.score }),
        ...(body.certificateUrl !== undefined && { certificateUrl: body.certificateUrl }),
        ...(body.expirationDate !== undefined && { expirationDate: body.expirationDate ? new Date(body.expirationDate) : null }),
      },
    });
  }

  async remove(user: AuthUser, id: string) {
    const { training, companyId } = await this.resolveCompany(id);
    if (!training) throw new NotFoundException('Capacitación no encontrada');
    await this.assertAccess(user, companyId);
    return this.prisma.training.delete({ where: { id } });
  }
}