import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Activity } from './activity.entity';
import { User } from './user.entity';

@Entity('adjuntos_actividad')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Activity, (activity) => activity.adjuntos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'actividad_id' })
  actividad: Activity;

  @Column({ type: 'uuid', name: 'actividad_id' })
  actividadId: string;

  @Column({ name: 'nombre_original', type: 'varchar', length: 255 })
  nombreOriginal: string;

  @Column({ name: 'nombre_guardado', type: 'varchar', length: 255 })
  nombreGuardado: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 120 })
  mimeType: string;

  @Column({ type: 'varchar', length: 15 })
  extension: string;

  @Column({ type: 'int' })
  tamano: number;

  @Column({ name: 'ruta_archivo', type: 'varchar', length: 255 })
  rutaArchivo: string;

  @ManyToOne(() => User, (user) => user.adjuntosSubidos, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'subido_por_id' })
  subidoPor: User;

  @Column({ type: 'uuid', name: 'subido_por_id' })
  subidoPorId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
