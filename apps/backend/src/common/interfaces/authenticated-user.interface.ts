import { RolUsuario } from '../enums';

export interface AuthenticatedUser {
  id: string;
  email: string;
  rol: RolUsuario;
  nombres: string;
}
