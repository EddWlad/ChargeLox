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
