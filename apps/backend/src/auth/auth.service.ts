import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.createFromRegister(dto);
    return {
      message: 'Usuario registrado correctamente.',
      user: this.usersService.sanitize(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const validPassword = await bcrypt.compare(dto.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const payload = this.usersService.buildAuthUser(user);
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: this.usersService.sanitize(user),
    };
  }
}
