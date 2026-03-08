import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AccionAuditoria } from '../../common/enums';
import { User } from './user.entity';

@Entity('auditoria')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 80 })
  entidad: string;

  @Column({ type: 'varchar', name: 'entidad_id', length: 100 })
  entidadId: string;

  @Column({ type: 'enum', enum: AccionAuditoria })
  accion: AccionAuditoria;

  @ManyToOne(() => User, (user) => user.auditorias, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User | null;

  @Column({ type: 'uuid', name: 'usuario_id', nullable: true })
  usuarioId: string | null;

  @Column({
    type: 'varchar',
    name: 'usuario_email',
    nullable: true,
    length: 150,
  })
  usuarioEmail: string | null;

  @Column({ type: 'text', name: 'resumen_cambio' })
  resumenCambio: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
