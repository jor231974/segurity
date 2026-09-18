import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async getInvoices(user: AuthUser, query: { status?: string; clientId?: string }) {
    const where: any = { companyId: user.companyId, deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.clientId) where.client = { Client_contract: { is: { id: query.clientId } } };

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        contract: { include: { client: { select: { id: true, commercialName: true } } } },
        service: true,
        payments: true,
      },
      orderBy: [{ periodStart: 'desc' }],
    });

    // Marcar vencidas no pagadas
    const now = new Date();
    const updated: any[] = [];
    for (const inv of invoices) {
      if (inv.dueDate < now && (inv.status === 'pendiente' || inv.status === 'parcialmente_pagada')) {
        const refreshed = await this.prisma.invoice.update({ where: { id: inv.id }, data: { status: 'vencida' }, include: { contract: { include: { client: true } }, payments: true } });
        updated.push(refreshed);
      } else {
        updated.push(inv);
      }
    }
    return updated;
  }

  async getInvoice(user: AuthUser, id: string) {
    const inv = await this.prisma.invoice.findUnique({
      where: { id },
      include: { contract: { include: { client: true } }, payments: true, service: true },
    });
    if (!inv) throw new NotFoundException('Factura no encontrada');
    if (inv.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');
    return inv;
  }

  async createInvoice(user: AuthUser, body: any) {
    if (!user.companyId) throw new BadRequestException('Sin empresa asociada');
    const contract = await this.prisma.contract.findFirst({ where: { id: body.contractId, companyId: user.companyId ?? undefined, deletedAt: null } });
    if (!contract) throw new NotFoundException('Contrato no encontrado');

    const number = body.number || `F-${contract.clientId.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const exists = await this.prisma.invoice.findUnique({ where: { companyId_number: { companyId: user.companyId ?? '', number } } });
    if (exists) throw new BadRequestException('Ya existe factura con ese número');

    return this.prisma.invoice.create({
      data: {
        companyId: user.companyId,
        contractId: contract.id,
        serviceId: body.serviceId || null,
        number,
        periodStart: new Date(body.periodStart),
        periodEnd: new Date(body.periodEnd),
        dueDate: new Date(body.dueDate),
        amount: new Decimal(body.amount),
        notes: body.notes,
        status: 'pendiente',
      },
      include: { contract: { include: { client: true } } },
    });
  }

  async addPayment(user: AuthUser, id: string, body: any) {
    const inv = await this.prisma.invoice.findUnique({ where: { id }, include: { payments: true } });
    if (!inv) throw new NotFoundException('Factura no encontrada');
    if (inv.companyId !== user.companyId) throw new ForbiddenException('Acceso denegado');

    const amount = new Decimal(body.amount);
    const paidSoFar = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    if (amount.greaterThan(Number(inv.amount) - paidSoFar)) {
      throw new BadRequestException('El pago excede el saldo');
    }

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: id,
        amount,
        method: body.method || 'transferencia',
        reference: body.reference,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
        receivedById: user.id,
      },
    });

    const newPaid = paidSoFar + Number(amount);
    const status = newPaid >= Number(inv.amount) ? 'pagada' : 'parcialmente_pagada';
    await this.prisma.invoice.update({ where: { id }, data: { paidAmount: new Decimal(newPaid), status } });

    return payment;
  }

  async getPayments(user: AuthUser, date?: string) {
    const where: any = { invoice: { companyId: user.companyId } };
    if (date) {
      const start = new Date(date + 'T00:00:00.000Z');
      const end = new Date(date + 'T23:59:59.999Z');
      where.paymentDate = { gte: start, lte: end };
    }
    return this.prisma.payment.findMany({
      where,
      include: { invoice: { include: { contract: { include: { client: true } } } }, receivedBy: { select: { name: true, lastName: true } } },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async getOverdue(user: AuthUser) {
    const now = new Date();
    const invoices = await this.prisma.invoice.findMany({
      where: { companyId: user.companyId ?? undefined, deletedAt: null, status: 'vencida', dueDate: { lt: now } },
      include: { contract: { include: { client: true } } },
      orderBy: { dueDate: 'asc' },
    });
    const totalOutstanding = invoices.reduce((s, i) => s + (Number(i.amount) - Number(i.paidAmount)), 0);
    return { count: invoices.length, totalOutstanding, invoices };
  }

  async getAging(user: AuthUser) {
    const now = new Date();
    const invoices = await this.prisma.invoice.findMany({
      where: { companyId: user.companyId ?? undefined, deletedAt: null, status: { in: ['vencida', 'parcialmente_pagada', 'pendiente'] } },
      include: { contract: { include: { client: { select: { id: true, commercialName: true } } } } },
    });

    const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    for (const inv of invoices) {
      const days = Math.floor((now.getTime() - inv.dueDate.getTime()) / 86400000);
      const outstanding = Number(inv.amount) - Number(inv.paidAmount);
      if (days <= 30) buckets['0-30'] += outstanding;
      else if (days <= 60) buckets['31-60'] += outstanding;
      else if (days <= 90) buckets['61-90'] += outstanding;
      else buckets['90+'] += outstanding;
    }
    return buckets;
  }
}