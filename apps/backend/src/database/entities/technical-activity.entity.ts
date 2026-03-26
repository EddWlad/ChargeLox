import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  EstadoActividadTecnica,
  Prioridad,
  TipoActividadTecnica,
} from '../../common/enums';
import { ChargingPoint } from './charging-point.entity';
import { User } from './user.entity';
import { TechnicalActivityComment } from './technical-activity-comment.entity';
import { TechnicalActivityEvidence } from './technical-activity-evidence.entity';
import { TechnicalActivityHistory } from './technical-activity-history.entity';

@Entity('actividades_tecnicas')
export class TechnicalActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tipo_actividad', type: 'enum', enum: TipoActividadTecnica })
  tipoActividad: TipoActividadTecnica;

  @Column({ type: 'varchar', length: 180 })
  titulo: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'enum', enum: Prioridad, default: Prioridad.MEDIA })
  prioridad: Prioridad;

  @Column({
    type: 'enum',
    enum: EstadoActividadTecnica,
    default: EstadoActividadTecnica.ASIGNADA,
  })
  estado: EstadoActividadTecnica;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'creado_por_id' })
  creadoPor: User;

  @Column({ type: 'uuid', name: 'creado_por_id' })
  creadoPorId: string;

  @Column({ type: 'varchar', name: 'creado_por_nombre', length: 180 })
  creadoPorNombre: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tecnico_asignado_id' })
  tecnicoAsignado: User;

  @Column({ type: 'uuid', name: 'tecnico_asignado_id' })
  tecnicoAsignadoId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supervisor_asignador_id' })
  supervisorAsignador: User;

  @Column({ type: 'uuid', name: 'supervisor_asignador_id' })
  supervisorAsignadorId: string;

  @Column({ type: 'date', name: 'fecha_programada' })
  fechaProgramada: string;

  @Column({ type: 'date', name: 'fecha_limite', nullable: true })
  fechaLimite: string | null;

  @Column({ type: 'date', name: 'fecha_ejecucion', nullable: true })
  fechaEjecucion: string | null;

  @Column({ type: 'date', name: 'fecha_instalacion', nullable: true })
  fechaInstalacion: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  ubicacion: string | null;

  @ManyToOne(() => ChargingPoint, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'charging_point_id' })
  chargingPoint: ChargingPoint | null;

  @Column({ type: 'uuid', name: 'charging_point_id', nullable: true })
  chargingPointId: string | null;

  @Column({ type: 'varchar', name: 'codigo_asignado', length: 120, nullable: true })
  codigoAsignado: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  serial: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  puk: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  marca: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  modelo: string | null;

  @Column({ type: 'varchar', name: 'estado_inicial', length: 80, nullable: true })
  estadoInicial: string | null;

  @Column({ type: 'text', name: 'caracteristicas_tecnicas', nullable: true })
  caracteristicasTecnicas: string | null;

  @Column({ type: 'text', nullable: true })
  diagnostico: string | null;

  @Column({ type: 'text', nullable: true })
  hallazgos: string | null;

  @Column({ type: 'text', name: 'acciones_realizadas', nullable: true })
  accionesRealizadas: string | null;

  @Column({ type: 'text', name: 'componentes_intervenidos', nullable: true })
  componentesIntervenidos: string | null;

  @Column({ type: 'text', nullable: true })
  recomendaciones: string | null;

  @Column({ type: 'varchar', name: 'estado_final', length: 80, nullable: true })
  estadoFinal: string | null;

  @Column({ type: 'text', name: 'observaciones_iniciales', nullable: true })
  observacionesIniciales: string | null;

  @Column({ type: 'text', name: 'observaciones_ejecucion', nullable: true })
  observacionesEjecucion: string | null;

  @Column({ type: 'text', name: 'observaciones_cierre', nullable: true })
  observacionesCierre: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => TechnicalActivityComment, (comment) => comment.actividadTecnica)
  comentarios: TechnicalActivityComment[];

  @OneToMany(() => TechnicalActivityEvidence, (evidence) => evidence.actividadTecnica)
  evidencias: TechnicalActivityEvidence[];

  @OneToMany(() => TechnicalActivityHistory, (history) => history.actividadTecnica)
  historial: TechnicalActivityHistory[];
}
