import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('notificaciones')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.notificaciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_destino_id' })
  usuarioDestino: User;

  @Column({ type: 'uuid', name: 'usuario_destino_id' })
  usuarioDestinoId: string;

  @Column({ type: 'varchar', length: 180 })
  titulo: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ type: 'varchar', length: 80 })
  tipo: string;

  @Column({ type: 'uuid', name: 'referencia_id', nullable: true })
  referenciaId: string | null;

  @Column({ type: 'boolean', default: false })
  leida: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
