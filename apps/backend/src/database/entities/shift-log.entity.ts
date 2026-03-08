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
import { EstadoTurno } from '../../common/enums';
import { User } from './user.entity';
import { Activity } from './activity.entity';

@Entity('turnos_monitoreo')
export class ShiftLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.turnos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @Column({ type: 'uuid', name: 'usuario_id' })
  usuarioId: string;

  @Column({ name: 'fecha_turno', type: 'date' })
  fechaTurno: string;

  @Column({ name: 'hora_inicio', type: 'timestamptz' })
  horaInicio: Date;

  @Column({ name: 'hora_fin', type: 'timestamptz', nullable: true })
  horaFin: Date | null;

  @Column({
    name: 'total_horas',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  totalHoras: number | null;

  @Column({
    name: 'estado_turno',
    type: 'enum',
    enum: EstadoTurno,
    default: EstadoTurno.ABIERTO,
  })
  estadoTurno: EstadoTurno;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Activity, (activity) => activity.turno)
  actividades: Activity[];
}
