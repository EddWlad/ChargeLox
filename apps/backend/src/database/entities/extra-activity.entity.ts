import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ExtraActivityPriority,
  ExtraActivityStatus,
  ExtraActivityType,
  WorkTimeCategory,
} from '../../common/enums';
import { User } from './user.entity';

@Entity('actividades_extra')
export class ExtraActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'usuario_id' })
  user: User;

  @Column({ type: 'uuid', name: 'usuario_id' })
  userId: string;

  @Column({ type: 'enum', enum: ExtraActivityType })
  type: ExtraActivityType;

  @Column({ type: 'varchar', length: 180 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', name: 'module_name', length: 150, nullable: true })
  moduleName: string | null;

  @Column({ type: 'enum', enum: ExtraActivityPriority })
  priority: ExtraActivityPriority;

  @Column({
    type: 'enum',
    enum: WorkTimeCategory,
    name: 'work_time_category',
  })
  workTimeCategory: WorkTimeCategory;

  @Column({
    type: 'varchar',
    name: 'external_reference',
    length: 120,
    nullable: true,
  })
  externalReference: string | null;

  @Column({ type: 'enum', enum: ExtraActivityStatus })
  status: ExtraActivityStatus;

  @Column({ type: 'timestamptz', name: 'started_at' })
  startedAt: Date;

  @Column({ type: 'timestamptz', name: 'ended_at', nullable: true })
  endedAt: Date | null;

  @Column({ type: 'int', name: 'duration_minutes', nullable: true })
  durationMinutes: number | null;

  @Column({ type: 'text', name: 'result_description', nullable: true })
  resultDescription: string | null;

  @Column({ type: 'varchar', name: 'evidence_url', length: 500, nullable: true })
  evidenceUrl: string | null;

  @Column({
    type: 'varchar',
    name: 'evidence_file_name',
    length: 255,
    nullable: true,
  })
  evidenceFileName: string | null;

  @Column({
    type: 'varchar',
    name: 'evidence_mime_type',
    length: 120,
    nullable: true,
  })
  evidenceMimeType: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
