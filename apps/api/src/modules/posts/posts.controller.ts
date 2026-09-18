import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '@servicom/shared';

@ApiTags('Puestos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @Permissions(PERMISSIONS.POSTS_VIEW)
  @ApiOperation({ summary: 'Listar puestos' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.postsService.findAll(user);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.POSTS_VIEW)
  @ApiOperation({ summary: 'Obtener puesto' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.findOne(user, id);
  }

  @Post()
  @Permissions(PERMISSIONS.POSTS_CREATE)
  @ApiOperation({ summary: 'Crear puesto' })
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.postsService.create(user, body);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.POSTS_EDIT)
  @ApiOperation({ summary: 'Actualizar puesto' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.postsService.update(user, id, body);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.POSTS_DELETE)
  @ApiOperation({ summary: 'Desactivar puesto' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.remove(user, id);
  }
}