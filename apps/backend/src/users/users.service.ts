import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { QueryFailedError, Repository } from 'typeorm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AccionAuditoria, RolUsuario } from '../common/enums';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { User } from '../database/entities';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }
    return user;
  }

  async createFromRegister(payload: {
    nombres: string;
    apellidos?: string;
    email: string;
    password: string;
  }): Promise<User> {
    const exists = await this.findByEmail(payload.email);
    if (exists) {
      throw new ConflictException('El correo ya está registrado.');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const created = this.usersRepository.create({
      nombres: payload.nombres,
      apellidos: payload.apellidos ?? null,
      email: payload.email.toLowerCase(),
      passwordHash,
      rol: RolUsuario.ANALISTA,
      activo: true,
    });

    const saved = await this.usersRepository.save(created);

    await this.auditLogsService.log({
      entidad: 'User',
      entidadId: saved.id,
      accion: AccionAuditoria.CREATE,
      resumenCambio: 'Registro público de usuario ANALISTA.',
      actor: null,
    });

    return saved;
  }

  async createByAdmin(
    dto: CreateUserDto,
    actor: AuthenticatedUser,
  ): Promise<Omit<User, 'passwordHash'>> {
    const exists = await this.findByEmail(dto.email);
    if (exists) {
      throw new ConflictException('El correo ya está registrado.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const created = this.usersRepository.create({
      nombres: dto.nombres,
      apellidos: dto.apellidos ?? null,
      email: dto.email.toLowerCase(),
      passwordHash,
      rol: dto.rol ?? RolUsuario.ANALISTA,
      activo: dto.activo ?? true,
    });

    const saved = await this.usersRepository.save(created);

    await this.auditLogsService.log({
      entidad: 'User',
      entidadId: saved.id,
      accion: AccionAuditoria.CREATE,
      resumenCambio: 'Usuario creado por administrador.',
      actor,
    });

    return this.sanitize(saved);
  }

  async list(query: QueryUsersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.usersRepository
      .createQueryBuilder('u')
      .orderBy('u.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search) {
      qb.where('(u.nombres ILIKE :search OR u.email ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((user) => this.sanitize(user)),
      page,
      limit,
      total,
    };
  }

  async getSanitizedById(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.findById(id);
    return this.sanitize(user);
  }

  async updateByAdmin(
    id: string,
    dto: UpdateUserDto,
    actor: AuthenticatedUser,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.findById(id);

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const exists = await this.findByEmail(dto.email);
      if (exists) {
        throw new ConflictException(
          'El correo ya está registrado por otro usuario.',
        );
      }
    }

    Object.assign(user, {
      nombres: dto.nombres ?? user.nombres,
      apellidos: dto.apellidos ?? user.apellidos,
      email: dto.email ? dto.email.toLowerCase() : user.email,
      rol: dto.rol ?? user.rol,
      activo: dto.activo ?? user.activo,
    });

    const saved = await this.usersRepository.save(user);

    await this.auditLogsService.log({
      entidad: 'User',
      entidadId: saved.id,
      accion: AccionAuditoria.UPDATE,
      resumenCambio: 'Usuario actualizado por administrador.',
      actor,
    });

    return this.sanitize(saved);
  }

  async removeByAdmin(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<{ action: 'deleted' | 'deactivated'; message: string }> {
    if (id === actor.id) {
      throw new BadRequestException(
        'No se permite eliminar el usuario autenticado actualmente.',
      );
    }

    const user = await this.findById(id);
    const userId = user.id;

    try {
      await this.usersRepository.delete(userId);

      await this.auditLogsService.log({
        entidad: 'User',
        entidadId: userId,
        accion: AccionAuditoria.DELETE,
        resumenCambio: 'Usuario eliminado por administrador.',
        actor,
      });

      return {
        action: 'deleted',
        message: 'Usuario eliminado.',
      };
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { driverError?: { code?: string } })
          .driverError?.code === '23503'
      ) {
        user.activo = false;
        await this.usersRepository.save(user);

        await this.auditLogsService.log({
          entidad: 'User',
          entidadId: userId,
          accion: AccionAuditoria.UPDATE,
          resumenCambio:
            'Usuario desactivado por referencias existentes (no eliminable por FK).',
          actor,
        });

        return {
          action: 'deactivated',
          message:
            'El usuario tiene historial relacionado y no se puede eliminar físicamente. Se desactivó.',
        };
      }

      throw error;
    }
  }

  async getMyProfile(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.findById(userId);
    return this.sanitize(user);
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.findById(userId);

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const exists = await this.findByEmail(dto.email);
      if (exists) {
        throw new ConflictException(
          'El correo ya está registrado por otro usuario.',
        );
      }
    }

    Object.assign(user, {
      nombres: dto.nombres ?? user.nombres,
      apellidos: dto.apellidos ?? user.apellidos,
      email: dto.email ? dto.email.toLowerCase() : user.email,
    });

    const saved = await this.usersRepository.save(user);
    return this.sanitize(saved);
  }

  async changeMyPassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.findById(userId);
    const matches = await bcrypt.compare(dto.passwordActual, user.passwordHash);

    if (!matches) {
      throw new BadRequestException('La contraseña actual no es válida.');
    }

    user.passwordHash = await bcrypt.hash(dto.nuevaPassword, 10);
    await this.usersRepository.save(user);
  }

  async updateRole(
    userId: string,
    rol: RolUsuario,
    actor: AuthenticatedUser,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.findById(userId);
    user.rol = rol;
    const saved = await this.usersRepository.save(user);

    await this.auditLogsService.log({
      entidad: 'User',
      entidadId: saved.id,
      accion: AccionAuditoria.UPDATE,
      resumenCambio: `Cambio de rol a ${rol}.`,
      actor,
    });

    return this.sanitize(saved);
  }

  async updateAvatar(
    userId: string,
    avatarUrl: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.findById(userId);
    user.avatarUrl = avatarUrl;
    const saved = await this.usersRepository.save(user);
    return this.sanitize(saved);
  }

  sanitize(user: User): Omit<User, 'passwordHash'> {
    const safeUser: Partial<User> = { ...user };
    delete safeUser.passwordHash;
    return safeUser as Omit<User, 'passwordHash'>;
  }

  buildAuthUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      rol: user.rol,
      nombres: user.nombres,
    };
  }
}
