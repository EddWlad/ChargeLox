import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '../common/enums';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Usuarios')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtiene el perfil del usuario autenticado.' })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getMyProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualiza datos básicos del perfil propio.' })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateMyProfile(user.id, dto);
  }

  @Patch('me/password')
  @ApiOperation({
    summary: 'Permite cambiar la contraseña del usuario autenticado.',
  })
  async updatePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changeMyPassword(user.id, dto);
    return { message: 'Contraseña actualizada correctamente.' };
  }

  @Patch('me/avatar')
  @ApiOperation({ summary: 'Sube avatar del usuario autenticado.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: { type: 'string', format: 'binary' },
      },
      required: ['avatar'],
    },
  })
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: process.env.AVATARS_UPLOAD_DIR ?? 'uploads/avatars',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `avatar-${unique}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: Number(process.env.MAX_FILE_SIZE_BYTES ?? 5_000_000),
      },
    }),
  )
  async updateAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateAvatar(user.id, avatarUrl);
  }

  @Post()
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Crea un usuario desde administración.' })
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.createByAdmin(dto, actor);
  }

  @Get()
  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.ANALISTA)
  @ApiOperation({ summary: 'Lista usuarios con paginación y búsqueda (admin y analista).' })
  list(@Query() query: QueryUsersDto) {
    return this.usersService.list(query);
  }

  @Get(':id')
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Obtiene detalle de usuario por id.' })
  getById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.getSanitizedById(id);
  }

  @Patch(':id')
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Actualiza un usuario desde administración.' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.updateByAdmin(id, dto, actor);
  }

  @Patch(':id/role')
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Cambia rol de usuario (solo admin).' })
  updateRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ChangeRoleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.updateRole(id, dto.rol, actor);
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMINISTRADOR)
  @ApiOperation({ summary: 'Elimina usuario por id (solo admin).' })
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.removeByAdmin(id, actor);
  }
}


