export enum RolUsuario {
  ADMINISTRADOR = 'ADMINISTRADOR',
  SUPERVISOR = 'SUPERVISOR',
  TECNICO = 'TECNICO',
  GESTOR_DE_VISITAS = 'GESTOR_DE_VISITAS',
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

export enum TipoActividadTecnica {
  INSTALACION = 'INSTALACION',
  MANTENIMIENTO_PREVENTIVO = 'MANTENIMIENTO_PREVENTIVO',
  MANTENIMIENTO_CORRECTIVO = 'MANTENIMIENTO_CORRECTIVO',
  VISITA_TECNICA = 'VISITA_TECNICA',
  REVISION_TECNICA = 'REVISION_TECNICA',
}

export enum EstadoActividadTecnica {
  ASIGNADA = 'ASIGNADA',
  EN_PROCESO = 'EN_PROCESO',
  COMPLETADA = 'COMPLETADA',
  OBSERVADA = 'OBSERVADA',
  CANCELADA = 'CANCELADA',
}

export enum EstadoPermisoAcceso {
  NOT_REQUIRED = 'NOT_REQUIRED',
  PENDING = 'PENDING',
  UPLOADED = 'UPLOADED',
}

export enum TipoInfraestructuraTecnica {
  PUNTO_CARGA = 'PUNTO_CARGA',
  ELECTROLINERA = 'ELECTROLINERA',
  BARRERA = 'BARRERA',
}

export enum AccionAuditoria {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum ExtraActivityType {
  QA_FUNCTIONAL = 'QA_FUNCTIONAL',
  QA_UI = 'QA_UI',
  BUG_REPORT = 'BUG_REPORT',
  BUG_FIX = 'BUG_FIX',
  BUG_VALIDATION = 'BUG_VALIDATION',
  PRODUCTION_REVIEW = 'PRODUCTION_REVIEW',
  OPERATIONAL_SUPPORT = 'OPERATIONAL_SUPPORT',
  DOCUMENTATION = 'DOCUMENTATION',
  MEETING = 'MEETING',
  TRAINING = 'TRAINING',
  TECHNICAL_ANALYSIS = 'TECHNICAL_ANALYSIS',
  EXTRA_MONITORING = 'EXTRA_MONITORING',
  OTHER = 'OTHER',
}

export enum WorkTimeCategory {
  DURING_SHIFT = 'DURING_SHIFT',
  OUTSIDE_SHIFT = 'OUTSIDE_SHIFT',
  WEEKEND_OR_HOLIDAY = 'WEEKEND_OR_HOLIDAY',
  EMERGENCY = 'EMERGENCY',
  MIXED = 'MIXED',
}

export enum ExtraActivityStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

export enum ExtraActivityPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
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

export interface TechnicalActivity {
  id: string;
  tipoActividad: TipoActividadTecnica;
  infrastructureType: TipoInfraestructuraTecnica;
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  estado: EstadoActividadTecnica;
  creadoPorId: string;
  creadoPorNombre: string;
  tecnicoAsignadoId: string;
  supervisorAsignadorId: string;
  fechaProgramada: string;
  fechaLimite: string | null;
  fechaEjecucion: string | null;
  fechaInstalacion: string | null;
  ubicacion: string | null;
  chargingPointId: string | null;
  codigoAsignado: string | null;
  serial: string | null;
  puk: string | null;
  marca: string | null;
  modelo: string | null;
  estadoInicial: string | null;
  caracteristicasTecnicas: string | null;
  diagnostico: string | null;
  hallazgos: string | null;
  accionesRealizadas: string | null;
  componentesIntervenidos: string | null;
  recomendaciones: string | null;
  estadoFinal: string | null;
  observacionesIniciales: string | null;
  observacionesEjecucion: string | null;
  observacionesCierre: string | null;
  requiresAccessPermit: boolean;
  accessPermitStatus: EstadoPermisoAcceso;
  accessPermitFileUrl: string | null;
  accessPermitFileName: string | null;
  accessPermitMimeType: string | null;
  accessPermitUploadedAt: string | null;
  accessPermitUploadedById: string | null;
  createdAt: string;
  updatedAt: string;
  tecnicoAsignado?: Pick<User, 'id' | 'nombres' | 'email' | 'rol'> | null;
  supervisorAsignador?: Pick<User, 'id' | 'nombres' | 'email' | 'rol'> | null;
  chargingPoint?: Pick<ChargingPoint, 'id' | 'nombre' | 'codigoAsignado'> | null;
}

export interface TechnicalActivityQuery {
  page?: number;
  limit?: number;
  tipoActividad?: TipoActividadTecnica | '';
  estado?: EstadoActividadTecnica | '';
  prioridad?: Prioridad | '';
  tecnicoAsignadoId?: string;
  chargingPointId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface CreateTechnicalActivityRequest {
  tipoActividad: TipoActividadTecnica;
  infrastructureType?: TipoInfraestructuraTecnica;
  titulo: string;
  descripcion?: string;
  prioridad: Prioridad;
  estado?: EstadoActividadTecnica;
  tecnicoAsignadoId: string;
  fechaProgramada: string;
  fechaLimite?: string;
  fechaEjecucion?: string;
  fechaInstalacion?: string;
  ubicacion?: string;
  chargingPointId?: string;
  codigoAsignado?: string;
  serial?: string;
  puk?: string;
  marca?: string;
  modelo?: string;
  estadoInicial?: string;
  caracteristicasTecnicas?: string;
  diagnostico?: string;
  hallazgos?: string;
  accionesRealizadas?: string;
  componentesIntervenidos?: string;
  recomendaciones?: string;
  estadoFinal?: string;
  observacionesIniciales?: string;
  observacionesEjecucion?: string;
  observacionesCierre?: string;
  requiresAccessPermit?: boolean;
}

export interface UpdateTechnicalActivityRequest
  extends Partial<CreateTechnicalActivityRequest> {}

export interface TechnicalActivityComment {
  id: string;
  actividadTecnicaId: string;
  usuarioId: string;
  nombreUsuario: string;
  comentario: string;
  estadoNuevo: EstadoActividadTecnica | null;
  createdAt: string;
}

export interface CreateTechnicalActivityCommentRequest {
  comentario: string;
  estadoNuevo?: EstadoActividadTecnica;
}

export interface TechnicalActivityEvidence {
  id: string;
  actividadTecnicaId: string;
  subidoPorId: string;
  nombreOriginal: string;
  mimeType: string;
  tamano: number;
  storageProvider: 'LOCAL' | 'CLOUDINARY';
  cloudinaryUrl: string | null;
  createdAt: string;
  downloadUrl: string;
}

export interface TechnicalActivityHistory {
  id: string;
  actividadTecnicaId: string;
  actorId: string | null;
  actorNombre: string | null;
  accion: string;
  descripcion: string;
  estadoAnterior: EstadoActividadTecnica | null;
  estadoNuevo: EstadoActividadTecnica | null;
  createdAt: string;
}

export interface ExtraActivity {
  id: string;
  userId: string;
  type: ExtraActivityType;
  title: string;
  description: string | null;
  moduleName: string | null;
  priority: ExtraActivityPriority;
  workTimeCategory: WorkTimeCategory;
  externalReference: string | null;
  status: ExtraActivityStatus;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  resultDescription: string | null;
  evidenceUrl: string | null;
  evidenceFileName: string | null;
  evidenceMimeType: string | null;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'nombres' | 'apellidos' | 'email' | 'rol'> | null;
}

export interface ExtraActivityQuery {
  page?: number;
  limit?: number;
  type?: ExtraActivityType | '';
  status?: ExtraActivityStatus | '';
  workTimeCategory?: WorkTimeCategory | '';
  priority?: ExtraActivityPriority | '';
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  externalReference?: string;
}

export interface StartExtraActivityRequest {
  type: ExtraActivityType;
  title: string;
  description?: string;
  moduleName?: string;
  priority: ExtraActivityPriority;
  workTimeCategory: WorkTimeCategory;
  externalReference?: string;
}

export interface UpdateExtraActivityRequest {
  type?: ExtraActivityType;
  title?: string;
  description?: string;
  moduleName?: string;
  priority?: ExtraActivityPriority;
  workTimeCategory?: WorkTimeCategory;
  externalReference?: string;
  resultDescription?: string;
}

export interface FinishExtraActivityRequest {
  resultDescription?: string;
}

export interface CancelExtraActivityRequest {
  reason?: string;
}

export interface ExtraActivitySummaryMe {
  minutesToday: number;
  hoursToday: number;
  minutesMonth: number;
  hoursMonth: number;
  minutesOutsideShift: number;
  hoursOutsideShift: number;
  finishedCount: number;
  activeActivity: ExtraActivity | null;
}

export interface ExtraActivitySummaryGlobal {
  minutesMonth: number;
  hoursMonth: number;
  minutesOutsideShift: number;
  hoursOutsideShift: number;
  finishedCount: number;
  inProgressCount: number;
  byUser: Array<{
    user: Pick<User, 'id' | 'nombres' | 'apellidos' | 'email'>;
    minutesMonth: number;
    hoursMonth: number;
    finishedCount: number;
  }>;
}
