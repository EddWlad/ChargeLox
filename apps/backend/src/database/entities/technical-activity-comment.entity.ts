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

@Entity('comentarios_actividad_tecnica')
export class TechnicalActivityComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TechnicalActivity, (activity) => activity.comentarios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'actividad_tecnica_id' })
  actividadTecnica: TechnicalActivity;

  @Column({ type: 'uuid', name: 'actividad_tecnica_id' })
  actividadTecnicaId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @Column({ type: 'uuid', name: 'usuario_id' })
  usuarioId: string;

  @Column({ type: 'varchar', name: 'nombre_usuario', length: 180 })
  nombreUsuario: string;

  @Column({ type: 'text' })
  comentario: string;

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
