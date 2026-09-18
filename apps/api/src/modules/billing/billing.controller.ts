import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Facturación y cobranza')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('invoices')
  @Permissions(PERMISSIONS.BILLING_VIEW)
  @ApiOperation({ summary: 'Listar facturas' })
  getInvoices(@CurrentUser() user: AuthUser, @Query('status') status?: string, @Query('clientId') clientId?: string) {
    return this.billingService.getInvoices(user, { status, clientId });
  }

  @Post('invoices')
  @Permissions(PERMISSIONS.BILLING_CREATE)
  @ApiOperation({ summary: 'Crear factura' })
  createInvoice(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.billingService.createInvoice(user, body);
  }

  @Get('invoices/:id')
  @Permissions(PERMISSIONS.BILLING_VIEW)
  @ApiOperation({ summary: 'Obtener factura' })
  getInvoice(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.billingService.getInvoice(user, id);
  }

  @Post('invoices/:id/pay')
  @Permissions(PERMISSIONS.BILLING_PAYMENT)
  @ApiOperation({ summary: 'Registrar pago' })
  addPayment(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.billingService.addPayment(user, id, body);
  }

  @Get('payments')
  @Permissions(PERMISSIONS.BILLING_VIEW)
  @ApiOperation({ summary: 'Listar pagos' })
  getPayments(@CurrentUser() user: AuthUser, @Query('date') date?: string) {
    return this.billingService.getPayments(user, date);
  }

  @Get('overdue')
  @Permissions(PERMISSIONS.BILLING_VIEW)
  @ApiOperation({ summary: 'Facturas vencidas' })
  getOverdue(@CurrentUser() user: AuthUser) {
    return this.billingService.getOverdue(user);
  }

  @Get('aging')
  @Permissions(PERMISSIONS.BILLING_VIEW)
  @ApiOperation({ summary: 'Antigüedad de saldos por cliente' })
  getAging(@CurrentUser() user: AuthUser) {
    return this.billingService.getAging(user);
  }
}