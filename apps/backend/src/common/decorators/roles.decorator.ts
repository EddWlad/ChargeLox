import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants';
import { RolUsuario } from '../enums';

export const Roles = (...roles: RolUsuario[]) => SetMetadata(ROLES_KEY, roles);
