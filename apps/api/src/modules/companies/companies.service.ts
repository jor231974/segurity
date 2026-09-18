import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string | null) {
    if (!id) throw new NotFoundException('No hay empresa asociada');
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Empresa no encontrada');
    return company;
  }

  async update(id: string | null, data: any) {
    if (!id) throw new NotFoundException('No hay empresa asociada');
    return this.prisma.company.update({
      where: { id },
      data: {
        ...(data.legalName && { legalName: data.legalName }),
        ...(data.commercialName && { commercialName: data.commercialName }),
        ...(data.rfc !== undefined && { rfc: data.rfc }),
        ...(data.address && { address: data.address }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.timezone && { timezone: data.timezone }),
        ...(data.currency && { currency: data.currency }),
        ...(data.operationalParams && { operationalParams: data.operationalParams }),
      },
    });
  }

  async getSettings(id: string | null) {
    if (!id) throw new NotFoundException('No hay empresa asociada');
    return this.prisma.systemSetting.findMany({
      where: { companyId: id },
    });
  }

  async updateSettings(id: string | null, settings: Record<string, any>) {
    if (!id) throw new NotFoundException('No hay empresa asociada');
    const results: Promise<any>[] = [];
    for (const [key, value] of Object.entries(settings)) {
      results.push(
        this.prisma.systemSetting.upsert({
          where: { companyId_key: { companyId: id, key } },
          create: { companyId: id, key, value: value as any },
          update: { value: value as any },
        }),
      );
    }
    const data = await Promise.all(results);
    return { updated: data.length, settings: data };
  }

  async getBranches(id: string | null) {
    if (!id) throw new NotFoundException('No hay empresa asociada');
    return this.prisma.branch.findMany({
      where: { companyId: id },
      orderBy: { name: 'asc' },
    });
  }

  async createBranch(id: string | null, data: any) {
    if (!id) throw new NotFoundException('No hay empresa asociada');
    return this.prisma.branch.create({
      data: {
        companyId: id,
        name: data.name,
        address: data.address,
        phone: data.phone,
        contactName: data.contactName,
      },
    });
  }

  async getZones(id: string | null) {
    if (!id) throw new NotFoundException('No hay empresa asociada');
    return this.prisma.zone.findMany({
      where: { companyId: id },
      orderBy: { name: 'asc' },
    });
  }

  async createZone(id: string | null, data: any) {
    if (!id) throw new NotFoundException('No hay empresa asociada');
    return this.prisma.zone.create({
      data: {
        companyId: id,
        name: data.name,
        description: data.description,
      },
    });
  }

  async getIncidentTypes(id: string | null) {
    if (!id) throw new NotFoundException('No hay empresa asociada');
    return this.prisma.incidentType.findMany({
      where: { companyId: id },
      orderBy: { name: 'asc' },
    });
  }

  async createIncidentType(id: string | null, data: any) {
    if (!id) throw new NotFoundException('No hay empresa asociada');
    return this.prisma.incidentType.create({
      data: {
        companyId: id,
        name: data.name,
        color: data.color,
      },
    });
  }
}