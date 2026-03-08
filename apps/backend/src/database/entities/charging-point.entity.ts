import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  EstadoConexion,
  EstadoPunto,
  Prioridad,
  TipoPunto,
} from '../../common/enums';
import { Activity } from './activity.entity';

@Entity('puntos_carga')
export class ChargingPoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  nombre: string;

  @Column({
    type: 'varchar',
    name: 'codigo_asignado',
    unique: true,
    length: 60,
  })
  codigoAsignado: string;

  @Column({ type: 'varchar', length: 120 })
  serial: string;

  @Column({ type: 'varchar', length: 120 })
  puk: string;

  @Column({ type: 'enum', enum: Prioridad, default: Prioridad.MEDIA })
  prioridad: Prioridad;

  @Column({ type: 'enum', enum: EstadoPunto, default: EstadoPunto.LIBRE })
  estado: EstadoPunto;

  @Column({
    name: 'estado_conexion',
    type: 'enum',
    enum: EstadoConexion,
    default: EstadoConexion.OK,
  })
  estadoConexion: EstadoConexion;

  @Column({ type: 'varchar', length: 50 })
  puerto: string;

  @Column({ type: 'enum', enum: TipoPunto, default: TipoPunto.PUNTO_CARGA })
  tipo: TipoPunto;

  @Column({ type: 'varchar', name: 'imagen_url', nullable: true, length: 255 })
  imagenUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Activity, (activity) => activity.chargingPoint)
  actividades: Activity[];
}
