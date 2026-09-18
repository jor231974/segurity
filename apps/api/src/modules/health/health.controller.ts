import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Salud')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check de la API y base de datos' })
  check() {
    return this.healthService.check();
  }
}