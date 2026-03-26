import * as bcrypt from 'bcrypt';
import dataSource from '../database/data-source';
import {
  Activity,
  ActivityComment,
  ChargingPoint,
  ShiftLog,
  User,
} from '../database/entities';
import {
  EstadoActividad,
  EstadoConexion,
  EstadoPunto,
  EstadoTurno,
  Prioridad,
  RolUsuario,
  TipoActividad,
  TipoPunto,
} from '../common/enums';

const randomItem = <T>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

async function seedUsers() {
  const repository = dataSource.getRepository(User);
  const passwordHash = await bcrypt.hash('Password123*', 10);

  const baseUsers = [
    {
      nombres: 'Admin',
      apellidos: 'Principal',
      email: 'admin@chargelox.com',
      rol: RolUsuario.ADMINISTRADOR,
      activo: true,
    },
    ...Array.from({ length: 2 }).map((_, index) => ({
      nombres: `Supervisor${index + 1}`,
      apellidos: 'Operaciones',
      email: `supervisor${index + 1}@chargelox.com`,
      rol: RolUsuario.SUPERVISOR,
      activo: true,
    })),
    ...Array.from({ length: 4 }).map((_, index) => ({
      nombres: `Tecnico${index + 1}`,
      apellidos: 'Campo',
      email: `tecnico${index + 1}@chargelox.com`,
      rol: RolUsuario.TECNICO,
      activo: true,
    })),
    ...Array.from({ length: 3 }).map((_, index) => ({
      nombres: `Analista${index + 1}`,
      apellidos: 'Monitoreo',
      email: `analista${index + 1}@chargelox.com`,
      rol: RolUsuario.ANALISTA,
      activo: true,
    })),
  ];

  for (const userData of baseUsers) {
    const existing = await repository.findOne({
      where: { email: userData.email },
    });

    if (!existing) {
      const created = repository.create({
        ...userData,
        passwordHash,
      });
      await repository.save(created);
    }
  }

  return repository.find();
}

async function seedChargingPoints() {
  const repository = dataSource.getRepository(ChargingPoint);

  for (let i = 1; i <= 30; i++) {
    const code = `CP-${String(i).padStart(3, '0')}`;
    const existing = await repository.findOne({
      where: { codigoAsignado: code },
    });

    if (!existing) {
      const created = repository.create({
        nombre: `Punto de carga ${i}`,
        codigoAsignado: code,
        serial: `SERIAL-${1000 + i}`,
        puk: `PUK-${2000 + i}`,
        prioridad: randomItem([
          Prioridad.ALTA,
          Prioridad.MEDIA,
          Prioridad.BAJA,
        ]),
        estado: randomItem([EstadoPunto.LIBRE, EstadoPunto.OCPP]),
        estadoConexion: randomItem([
          EstadoConexion.OK,
          EstadoConexion.DESCONECTADO,
          EstadoConexion.CONECTANDO,
        ]),
        puerto: `${(i % 4) + 1}`,
        tipo: randomItem([TipoPunto.PUNTO_CARGA, TipoPunto.ELECTROLINERA]),
      });

      await repository.save(created);
    }
  }

  return repository.find();
}

async function seedShiftLogs(users: User[]) {
  const repository = dataSource.getRepository(ShiftLog);

  for (const user of users) {
    const existing = await repository.findOne({
      where: { usuarioId: user.id },
    });
    if (existing) {
      continue;
    }

    const start = new Date();
    start.setHours(8, 0, 0, 0);

    const end = new Date(start);
    end.setHours(16, 0, 0, 0);

    const created = repository.create({
      usuarioId: user.id,
      fechaTurno: start.toISOString().slice(0, 10),
      horaInicio: start,
      horaFin: end,
      totalHoras: 8,
      estadoTurno: EstadoTurno.CERRADO,
    });

    await repository.save(created);
  }

  return repository.find();
}

async function seedActivities(
  users: User[],
  shifts: ShiftLog[],
  chargingPoints: ChargingPoint[],
) {
  const repository = dataSource.getRepository(Activity);
  const total = await repository.count();

  if (total >= 30) {
    return repository.find();
  }

  const missing = 30 - total;

  for (let i = 0; i < missing; i++) {
    const creator = randomItem(users);
    const targetUser = randomItem(users);
    const shift = randomItem(shifts);
    const cp = randomItem(chargingPoints);

    const created = repository.create({
      fechaNovedad: new Date(),
      fechaModificacion: new Date(),
      creadoPorId: creator.id,
      creadoPorNombre: creator.nombres,
      tipoActividad: randomItem([
        TipoActividad.NOVEDAD,
        TipoActividad.SEGUIMIENTO,
      ]),
      prioridad: randomItem([Prioridad.ALTA, Prioridad.MEDIA, Prioridad.BAJA]),
      descripcion: `Actividad de prueba #${total + i + 1}`,
      estado: randomItem([
        EstadoActividad.EN_REVISION,
        EstadoActividad.EN_PROCESO,
        EstadoActividad.COMPLETADA,
      ]),
      usuarioId: targetUser.id,
      turnoId: shift?.id ?? null,
      chargingPointId: cp?.id ?? null,
    });

    await repository.save(created);
  }

  return repository.find();
}

async function seedComments(users: User[], activities: Activity[]) {
  const repository = dataSource.getRepository(ActivityComment);
  const total = await repository.count();

  if (total >= 25) {
    return;
  }

  const missing = 25 - total;

  for (let i = 0; i < missing; i++) {
    const user = randomItem(users);
    const activity = randomItem(activities);

    const created = repository.create({
      actividadId: activity.id,
      usuarioId: user.id,
      nombreUsuario: user.nombres,
      comentario: `Comentario de prueba #${total + i + 1}`,
      estadoNuevo: randomItem([
        EstadoActividad.EN_REVISION,
        EstadoActividad.EN_PROCESO,
        EstadoActividad.COMPLETADA,
      ]),
      fechaComentario: new Date(),
    });

    await repository.save(created);
  }
}

async function runSeed() {
  try {
    await dataSource.initialize();
    console.log('Iniciando seed...');

    const users = await seedUsers();
    const chargingPoints = await seedChargingPoints();
    const shifts = await seedShiftLogs(users);
    const activities = await seedActivities(users, shifts, chargingPoints);
    await seedComments(users, activities);

    console.log('Seed completado correctamente.');
    console.log('Credenciales admin: admin@chargelox.com / Password123*');
    console.log(
      'Credencial supervisor ejemplo: supervisor1@chargelox.com / Password123*',
    );
    console.log(
      'Credencial técnico ejemplo: tecnico1@chargelox.com / Password123*',
    );
    console.log(
      'Credencial analista ejemplo: analista1@chargelox.com / Password123*',
    );
  } catch (error) {
    console.error('Error en seed:', error);
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void runSeed();
