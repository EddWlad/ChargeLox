import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EstadoActividad } from '../../common/enums';
import { Activity } from './activity.entity';
import { User } from './user.entity';

@Entity('comentarios_actividad')
export class ActivityComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Activity, (activity) => activity.comentarios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'actividad_id' })
  actividad: Activity;

  @Column({ type: 'uuid', name: 'actividad_id' })
  actividadId: string;

  @ManyToOne(() => User, (user) => user.comentarios, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @Column({ type: 'uuid', name: 'usuario_id' })
  usuarioId: string;

  @Column({ name: 'nombre_usuario', type: 'varchar', length: 180 })
  nombreUsuario: string;

  @Column({ type: 'text' })
  comentario: string;

  @Column({
    name: 'estado_nuevo',
    type: 'enum',
    enum: EstadoActividad,
    nullable: true,
  })
  estadoNuevo: EstadoActividad | null;

  @Column({ name: 'fecha_comentario', type: 'timestamptz' })
  fechaComentario: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
