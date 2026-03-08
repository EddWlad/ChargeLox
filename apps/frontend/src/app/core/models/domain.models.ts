export enum RolUsuario {
  ADMINISTRADOR = 'ADMINISTRADOR',
  ANALISTA = 'ANALISTA',
}

export enum Prioridad {
  ALTA = 'ALTA',
  MEDIA = 'MEDIA',
  BAJA = 'BAJA',
}

export enum EstadoPunto {
  LIBRE = 'LIBRE',
  OCPP = 'OCPP',
}

export enum EstadoConexion {
  OK = 'OK',
  DESCONECTADO = 'DESCONECTADO',
  CONECTANDO = 'CONECTANDO',
}

export enum TipoPunto {
  PUNTO_CARGA = 'PUNTO_CARGA',
  ELECTROLINERA = 'ELECTROLINERA',
}

export enum TipoActividad {
  NOVEDAD = 'NOVEDAD',
  SEGUIMIENTO = 'SEGUIMIENTO',
}

export enum EstadoActividad {
  EN_REVISION = 'EN_REVISION',
  EN_PROCESO = 'EN_PROCESO',
  COMPLETADA = 'COMPLETADA',
}

export enum EstadoTurno {
  ABIERTO = 'ABIERTO',
  CERRADO = 'CERRADO',
}

export enum AccionAuditoria {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export interface PaginationResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface User {
  id: string;
  nombres: string;
  apellidos: string | null;
  email: string;
  rol: RolUsuario;
  avatarUrl: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombres: string;
  apellidos?: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface ChargingPoint {
  id: string;
  nombre: string;
  codigoAsignado: string;
  serial?: string;
  puk?: string;
  prioridad: Prioridad;
  estado: EstadoPunto;
  estadoConexion: EstadoConexion;
  puerto: string;
  tipo: TipoPunto;
  imagenUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChargingPointQuery {
  page?: number;
  limit?: number;
  search?: string;
  estadoConexion?: EstadoConexion | '';
  prioridad?: Prioridad | '';
}

export interface CreateChargingPointRequest {
  nombre: string;
  codigoAsignado: string;
  serial: string;
  puk: string;
  prioridad: Prioridad;
  estado: EstadoPunto;
  estadoConexion: EstadoConexion;
  puerto: string;
  tipo?: TipoPunto;
}

export interface UpdateChargingPointRequest {
  nombre?: string;
  codigoAsignado?: string;
  serial?: string;
  puk?: string;
  prioridad?: Prioridad;
  estado?: EstadoPunto;
  estadoConexion?: EstadoConexion;
  puerto?: string;
  tipo?: TipoPunto;
}

export interface Activity {
  id: string;
  fechaNovedad: string;
  fechaModificacion: string;
  creadoPorId: string;
  creadoPorNombre: string;
  tipoActividad: TipoActividad;
  prioridad: Prioridad;
  descripcion: string;
  estado: EstadoActividad;
  usuarioId: string | null;
  turnoId: string | null;
  chargingPointId: string | null;
  createdAt: string;
  updatedAt: string;
  comentarios?: ActivityComment[];
  adjuntos?: Attachment[];
}

export interface ActivityQuery {
  page?: number;
  limit?: number;
  tipoActividad?: TipoActividad | '';
  prioridad?: Prioridad | '';
  estado?: EstadoActividad | '';
}

export interface CreateActivityRequest {
  tipoActividad: TipoActividad;
  prioridad: Prioridad;
  descripcion: string;
  estado?: EstadoActividad;
  usuarioId?: string;
  turnoId?: string;
  chargingPointId?: string;
}

export interface UpdateActivityRequest {
  tipoActividad?: TipoActividad;
  prioridad?: Prioridad;
  descripcion?: string;
  estado?: EstadoActividad;
  usuarioId?: string;
  turnoId?: string;
  chargingPointId?: string;
}

export interface ActivityComment {
  id: string;
  actividadId: string;
  usuarioId: string;
  nombreUsuario: string;
  comentario: string;
  estadoNuevo: EstadoActividad | null;
  fechaComentario: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityCommentRequest {
  comentario: string;
  estadoNuevo?: EstadoActividad;
}

export interface Attachment {
  id: string;
  actividadId: string;
  nombreOriginal: string;
  nombreGuardado: string;
  mimeType: string;
  extension: string;
  tamano: number;
  rutaArchivo: string;
  subidoPorId: string;
  createdAt: string;
}

export interface ShiftLog {
  id: string;
  usuarioId: string;
  fechaTurno: string;
  horaInicio: string;
  horaFin: string | null;
  totalHoras: number | null;
  estadoTurno: EstadoTurno;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftLogQuery {
  page?: number;
  limit?: number;
  usuarioId?: string;
}

export interface Notification {
  id: string;
  usuarioDestinoId: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  referenciaId: string | null;
  leida: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  entidad: string;
  entidadId: string;
  accion: AccionAuditoria;
  usuarioId: string | null;
  usuarioEmail: string | null;
  resumenCambio: string;
  createdAt: string;
}

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  entidad?: string;
  accion?: AccionAuditoria | '';
}

export interface ApiMessage {
  message: string;
}
