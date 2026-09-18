import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Restablecer contraseña con token' })
  resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar contraseña' })
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión' })
  logout(@CurrentUser() user: AuthUser, @Body() body: { token?: string }) {
    return this.authService.logout(user.id, body.token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  me(@CurrentUser() user: AuthUser) {
    return this.authService.getProfile(user.id);
  }
}