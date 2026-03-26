import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EstadoActividadTecnica } from '../../common/enums';
import { User } from './user.entity';
import { TechnicalActivity } from './technical-activity.entity';

@Entity('historial_actividad_tecnica')
export class TechnicalActivityHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TechnicalActivity, (activity) => activity.historial, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'actividad_tecnica_id' })
  actividadTecnica: TechnicalActivity;

  @Column({ type: 'uuid', name: 'actividad_tecnica_id' })
  actividadTecnicaId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor: User | null;

  @Column({ type: 'uuid', name: 'actor_id', nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', name: 'actor_nombre', length: 180, nullable: true })
  actorNombre: string | null;

  @Column({ type: 'varchar', length: 80 })
  accion: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({
    name: 'estado_anterior',
    type: 'enum',
    enum: EstadoActividadTecnica,
    nullable: true,
  })
  estadoAnterior: EstadoActividadTecnica | null;

  @Column({
    name: 'estado_nuevo',
    type: 'enum',
    enum: EstadoActividadTecnica,
    nullable: true,
  })
  estadoNuevo: EstadoActividadTecnica | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
