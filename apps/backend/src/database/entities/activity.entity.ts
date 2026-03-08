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
import { EstadoActividad, Prioridad, TipoActividad } from '../../common/enums';
import { User } from './user.entity';
import { ShiftLog } from './shift-log.entity';
import { ChargingPoint } from './charging-point.entity';
import { ActivityComment } from './activity-comment.entity';
import { Attachment } from './attachment.entity';

@Entity('actividades')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'fecha_novedad', type: 'timestamptz' })
  fechaNovedad: Date;

  @Column({ name: 'fecha_modificacion', type: 'timestamptz' })
  fechaModificacion: Date;

  @ManyToOne(() => User, (user) => user.actividadesCreadas, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'creado_por_id' })
  creadoPor: User;

  @Column({ type: 'uuid', name: 'creado_por_id' })
  creadoPorId: string;

  @Column({ type: 'varchar', name: 'creado_por_nombre', length: 180 })
  creadoPorNombre: string;

  @Column({ name: 'tipo_actividad', type: 'enum', enum: TipoActividad })
  tipoActividad: TipoActividad;

  @Column({ type: 'enum', enum: Prioridad, default: Prioridad.MEDIA })
  prioridad: Prioridad;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({
    type: 'enum',
    enum: EstadoActividad,
    default: EstadoActividad.EN_REVISION,
  })
  estado: EstadoActividad;

  @ManyToOne(() => User, (user) => user.actividadesRelacionadas, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'usuario_id' })
  usuarioRelacionado: User | null;

  @Column({ type: 'uuid', name: 'usuario_id', nullable: true })
  usuarioId: string | null;

  @ManyToOne(() => ShiftLog, (turno) => turno.actividades, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'turno_id' })
  turno: ShiftLog | null;

  @Column({ type: 'uuid', name: 'turno_id', nullable: true })
  turnoId: string | null;

  @ManyToOne(
    () => ChargingPoint,
    (chargingPoint) => chargingPoint.actividades,
    {
      onDelete: 'SET NULL',
      nullable: true,
    },
  )
  @JoinColumn({ name: 'charging_point_id' })
  chargingPoint: ChargingPoint | null;

  @Column({ type: 'uuid', name: 'charging_point_id', nullable: true })
  chargingPointId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ActivityComment, (comment) => comment.actividad)
  comentarios: ActivityComment[];

  @OneToMany(() => Attachment, (attachment) => attachment.actividad)
  adjuntos: Attachment[];
}
