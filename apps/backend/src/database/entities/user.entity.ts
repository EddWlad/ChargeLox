import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RolUsuario } from '../../common/enums';
import { ShiftLog } from './shift-log.entity';
import { Activity } from './activity.entity';
import { ActivityComment } from './activity-comment.entity';
import { Attachment } from './attachment.entity';
import { Notification } from './notification.entity';
import { AuditLog } from './audit-log.entity';

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  nombres: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  apellidos: string | null;

  @Column({ type: 'varchar', unique: true, length: 150 })
  email: string;

  @Column({ type: 'varchar', name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ type: 'enum', enum: RolUsuario, default: RolUsuario.ANALISTA })
  rol: RolUsuario;

  @Column({ type: 'varchar', name: 'avatar_url', nullable: true, length: 255 })
  avatarUrl: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ShiftLog, (shift) => shift.usuario)
  turnos: ShiftLog[];

  @OneToMany(() => Activity, (activity) => activity.creadoPor)
  actividadesCreadas: Activity[];

  @OneToMany(() => Activity, (activity) => activity.usuarioRelacionado)
  actividadesRelacionadas: Activity[];

  @OneToMany(() => ActivityComment, (comment) => comment.usuario)
  comentarios: ActivityComment[];

  @OneToMany(() => Attachment, (attachment) => attachment.subidoPor)
  adjuntosSubidos: Attachment[];

  @OneToMany(() => Notification, (notification) => notification.usuarioDestino)
  notificaciones: Notification[];

  @OneToMany(() => AuditLog, (audit) => audit.usuario)
  auditorias: AuditLog[];
}
