import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAccess(user: AuthUser, companyId: string | null) {
    if (!user.companyId) throw new ForbiddenException('Sin empresa asociada');
    if (companyId !== user.companyId && !user.roleCodes.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Acceso denegado');
    }
  }

  async findAll(user: AuthUser) {
    return this.prisma.contract.findMany({
      where: { companyId: user.companyId ?? undefined, deletedAt: null },
      include: {
        client: { select: { id: true, commercialName: true, legalName: true } },
        services: { include: { site: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: AuthUser, id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        client: true,
        services: { include: { site: true } },
        invoices: true,
      },
    });
    if (!contract || contract.deletedAt) throw new NotFoundException('Contrato no encontrado');
    await this.assertAccess(user, contract.companyId);
    return contract;
  }

  async create(user: AuthUser, body: any) {
    if (!user.companyId) throw new BadRequestException('Sin empresa asociada');

    const client = await this.prisma.client.findFirst({
      where: { id: body.clientId, companyId: user.companyId ?? undefined, deletedAt: null },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');

    const existing = await this.prisma.contract.findFirst({
      where: { companyId: user.companyId ?? undefined, number: body.number, deletedAt: null },
    });
    if (existing) throw new BadRequestException('Ya existe un contrato con ese número');

    const contract = await this.prisma.contract.create({
      data: {
        companyId: user.companyId,
        clientId: body.clientId,
        number: body.number,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        autoRenew: body.autoRenew ?? true,
        terms: body.terms,
        billingFrequency: body.billingFrequency || 'mensual',
        status: body.status || 'activo',
      },
    });

    if (body.services?.length) {
      for (const svc of body.services) {
        await this.prisma.contractService.create({
          data: {
            contractId: contract.id,
            siteId: svc.siteId,
            name: svc.name,
            guardCount: svc.guardCount,
            tariff: new Decimal(svc.tariff),
            estimatedCost: svc.estimatedCost ? new Decimal(svc.estimatedCost) : null,
            startDate: new Date(svc.startDate),
            endDate: svc.endDate ? new Date(svc.endDate) : null,
          },
        });
      }
    }
    return this.findOne(user, contract.id);
  }

  async update(user: AuthUser, id: string, body: any) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract || contract.deletedAt) throw new NotFoundException('Contrato no encontrado');
    await this.assertAccess(user, contract.companyId);

    return this.prisma.contract.update({
      where: { id },
      data: {
        ...(body.number && { number: body.number }),
        ...(body.startDate && { startDate: new Date(body.startDate) }),
        ...(body.endDate && { endDate: new Date(body.endDate) }),
        ...(body.autoRenew !== undefined && { autoRenew: body.autoRenew }),
        ...(body.terms !== undefined && { terms: body.terms }),
        ...(body.billingFrequency && { billingFrequency: body.billingFrequency }),
        ...(body.status && { status: body.status }),
      },
    });
  }

  async remove(user: AuthUser, id: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contrato no encontrado');
    await this.assertAccess(user, contract.companyId);
    return this.prisma.contract.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async addService(user: AuthUser, id: string, body: any) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contrato no encontrado');
    await this.assertAccess(user, contract.companyId);

    return this.prisma.contractService.create({
      data: {
        contractId: id,
        siteId: body.siteId,
        name: body.name,
        guardCount: body.guardCount ?? 1,
        tariff: new Decimal(body.tariff),
        estimatedCost: body.estimatedCost ? new Decimal(body.estimatedCost) : null,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    });
  }

  async getServices(user: AuthUser, id: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contrato no encontrado');
    await this.assertAccess(user, contract.companyId);
    return this.prisma.contractService.findMany({
      where: { contractId: id },
      include: { site: true },
    });
  }

  async getProfitability(user: AuthUser, id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { services: true },
    });
    if (!contract) throw new NotFoundException('Contrato no encontrado');
    await this.assertAccess(user, contract.companyId);

    const income = contract.services.reduce(
      (sum, s) => sum + Number(s.tariff),
      0,
    );
    const cost = contract.services.reduce(
      (sum, s) => sum + Number(s.estimatedCost || 0),
      0,
    );
    const margin = income > 0 ? (((income - cost) / income) * 100) : 0;

    return {
      contractId: id,
      servicesCount: contract.services.length,
      monthlyIncome: income,
      monthlyCost: cost,
      estimatedMargin: margin,
    };
  }
}