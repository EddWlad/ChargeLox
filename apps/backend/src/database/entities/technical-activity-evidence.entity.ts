import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { TechnicalActivity } from './technical-activity.entity';

export enum TechnicalEvidenceStorageProvider {
  LOCAL = 'LOCAL',
  CLOUDINARY = 'CLOUDINARY',
}

@Entity('evidencias_actividad_tecnica')
export class TechnicalActivityEvidence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TechnicalActivity, (activity) => activity.evidencias, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'actividad_tecnica_id' })
  actividadTecnica: TechnicalActivity;

  @Column({ type: 'uuid', name: 'actividad_tecnica_id' })
  actividadTecnicaId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'subido_por_id' })
  subidoPor: User;

  @Column({ type: 'uuid', name: 'subido_por_id' })
  subidoPorId: string;

  @Column({ name: 'nombre_original', type: 'varchar', length: 255 })
  nombreOriginal: string;

  @Column({ name: 'nombre_guardado', type: 'varchar', length: 255 })
  nombreGuardado: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 120 })
  mimeType: string;

  @Column({ type: 'int' })
  tamano: number;

  @Column({
    name: 'storage_provider',
    type: 'enum',
    enum: TechnicalEvidenceStorageProvider,
    default: TechnicalEvidenceStorageProvider.LOCAL,
  })
  storageProvider: TechnicalEvidenceStorageProvider;

  @Column({ name: 'ruta_archivo', type: 'varchar', length: 500, nullable: true })
  rutaArchivo: string | null;

  @Column({
    name: 'cloudinary_public_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  cloudinaryPublicId: string | null;

  @Column({ name: 'cloudinary_url', type: 'varchar', length: 500, nullable: true })
  cloudinaryUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
