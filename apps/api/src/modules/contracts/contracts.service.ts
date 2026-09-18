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

  private static readonly CONTRACT_STATUSES = ['activo', 'suspendido', 'cerrado'];
  private static readonly BILLING_FREQUENCIES = ['mensual', 'semanal', 'quincenal'];

  private static assertDateValid(value: any, label: string): Date {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${label} inválida`);
    }
    return date;
  }

  private assertContractNumberUnique(companyId: string, number: string, excludeId?: string) {
    return this.prisma.contract.findFirst({
      where: { companyId, number, deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
  }

  private async assertSiteBelongsToContract(siteId: string, companyId: string, clientId: string) {
    if (!siteId) return;
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      include: { client: { select: { companyId: true, id: true } } },
    });
    if (!site || site.deletedAt) throw new NotFoundException('Instalación no encontrada');
    if (site.client.companyId !== companyId) {
      throw new ForbiddenException('La instalación pertenece a otra empresa');
    }
    if (site.client.id !== clientId) {
      throw new BadRequestException(`La instalación "${site.name}" no pertenece al cliente del contrato`);
    }
  }

  private async validateServicePayload(body: any, companyId: string, clientId: string) {
    if (!body.name?.trim()) throw new BadRequestException('name del servicio es obligatorio');
    if (!body.tariff || Number.isNaN(Number(body.tariff)) || Number(body.tariff) <= 0) {
      throw new BadRequestException('tariff debe ser un número mayor a 0');
    }
    if (body.guardCount !== undefined && (Number.isNaN(Number(body.guardCount)) || Number(body.guardCount) < 1)) {
      throw new BadRequestException('guardCount debe ser al menos 1');
    }
    ContractsService.assertDateValid(body.startDate, 'startDate del servicio');
    if (body.endDate) ContractsService.assertDateValid(body.endDate, 'endDate del servicio');
    if (body.siteId) await this.assertSiteBelongsToContract(body.siteId, companyId, clientId);
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
    if (!body.number?.trim()) throw new BadRequestException('number es obligatorio');
    if (body.status && !ContractsService.CONTRACT_STATUSES.includes(body.status)) {
      throw new BadRequestException('status inválido');
    }
    if (body.billingFrequency && !ContractsService.BILLING_FREQUENCIES.includes(body.billingFrequency)) {
      throw new BadRequestException('billingFrequency inválida');
    }
    const startDate = ContractsService.assertDateValid(body.startDate, 'startDate');
    const endDate = ContractsService.assertDateValid(body.endDate, 'endDate');
    if (endDate < startDate) throw new BadRequestException('endDate debe ser posterior a startDate');

    const existing = await this.assertContractNumberUnique(user.companyId, body.number);
    if (existing) throw new BadRequestException('Ya existe un contrato con ese número');

    const contract = await this.prisma.contract.create({
      data: {
        companyId: user.companyId,
        clientId: body.clientId,
        number: body.number,
        startDate,
        endDate,
        autoRenew: body.autoRenew ?? true,
        terms: body.terms,
        billingFrequency: body.billingFrequency || 'mensual',
        status: body.status || 'activo',
      },
    });

    if (body.services?.length) {
      for (const svc of body.services) {
        await this.validateServicePayload(svc, user.companyId, client.id);
        if (svc.guardCount !== undefined && Number.isNaN(Number(svc.guardCount))) {
          throw new BadRequestException('guardCount debe ser un número');
        }
        await this.prisma.contractService.create({
          data: {
            contractId: contract.id,
            siteId: svc.siteId,
            name: svc.name,
            guardCount: Number(svc.guardCount ?? 1),
            tariff: new Decimal(svc.tariff),
            estimatedCost: svc.estimatedCost ? new Decimal(svc.estimatedCost) : null,
            startDate: ContractsService.assertDateValid(svc.startDate, 'startDate del servicio'),
            endDate: svc.endDate ? ContractsService.assertDateValid(svc.endDate, 'endDate del servicio') : null,
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

    if (body.number) {
      if (!body.number.trim()) throw new BadRequestException('number no puede quedar vacío');
      const dup = await this.assertContractNumberUnique(contract.companyId, body.number, id);
      if (dup) throw new BadRequestException('Ya existe un contrato con ese número');
    }
    if (body.status && !ContractsService.CONTRACT_STATUSES.includes(body.status)) {
      throw new BadRequestException('status inválido');
    }
    if (body.billingFrequency && !ContractsService.BILLING_FREQUENCIES.includes(body.billingFrequency)) {
      throw new BadRequestException('billingFrequency inválida');
    }
    let startDate = contract.startDate;
    let endDate = contract.endDate;
    if (body.startDate) startDate = ContractsService.assertDateValid(body.startDate, 'startDate');
    if (body.endDate) endDate = ContractsService.assertDateValid(body.endDate, 'endDate');
    if (endDate < startDate) throw new BadRequestException('endDate debe ser posterior a startDate');

    return this.prisma.contract.update({
      where: { id },
      data: {
        ...(body.number && { number: body.number }),
        ...(startDate !== contract.startDate && { startDate }),
        ...(endDate !== contract.endDate && { endDate }),
        ...(body.autoRenew !== undefined && { autoRenew: body.autoRenew }),
        ...(body.terms !== undefined && { terms: body.terms }),
        ...(body.billingFrequency && { billingFrequency: body.billingFrequency }),
        ...(body.status && { status: body.status }),
      },
    });
  }

  async remove(user: AuthUser, id: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract || contract.deletedAt) throw new NotFoundException('Contrato no encontrado');
    await this.assertAccess(user, contract.companyId);
    return this.prisma.contract.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async addService(user: AuthUser, id: string, body: any) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract || contract.deletedAt) throw new NotFoundException('Contrato no encontrado');
    await this.assertAccess(user, contract.companyId);

    await this.validateServicePayload(body, contract.companyId, contract.clientId);

    return this.prisma.contractService.create({
      data: {
        contractId: id,
        siteId: body.siteId,
        name: body.name,
        guardCount: Number(body.guardCount ?? 1),
        tariff: new Decimal(body.tariff),
        estimatedCost: body.estimatedCost ? new Decimal(body.estimatedCost) : null,
        startDate: ContractsService.assertDateValid(body.startDate, 'startDate del servicio'),
        endDate: body.endDate ? ContractsService.assertDateValid(body.endDate, 'endDate del servicio') : null,
      },
    });
  }

  async getServices(user: AuthUser, id: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract || contract.deletedAt) throw new NotFoundException('Contrato no encontrado');
    await this.assertAccess(user, contract.companyId);
    return this.prisma.contractService.findMany({
      where: { contractId: id, active: true },
      include: { site: true },
    });
  }

  async getProfitability(user: AuthUser, id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { services: { where: { active: true } } },
    });
    if (!contract || contract.deletedAt) throw new NotFoundException('Contrato no encontrado');
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