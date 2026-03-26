import dataSource from '../database/data-source';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function runMigrations() {
  const maxAttempts = Number(process.env.DB_CONNECT_RETRIES ?? 8);
  const retryDelayMs = Number(process.env.DB_CONNECT_RETRY_DELAY_MS ?? 2500);

  try {
    let initialized = false;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await dataSource.initialize();
        initialized = true;
        break;
      } catch (error) {
        const isLastAttempt = attempt === maxAttempts;

        if (isLastAttempt) {
          throw error;
        }

        console.warn(
          `No se pudo conectar a PostgreSQL (intento ${attempt}/${maxAttempts}). Reintentando en ${retryDelayMs}ms...`,
        );
        await wait(retryDelayMs);
      }
    }

    if (!initialized) {
      throw new Error('No fue posible inicializar el datasource de TypeORM.');
    }

    await dataSource.runMigrations();
    console.log('Migraciones ejecutadas correctamente.');
  } catch (error) {
    console.error('Error ejecutando migraciones:', error);
    console.error(
      'Verifique que PostgreSQL esté levantado (docker compose up -d) y que DB_HOST/DB_PORT sean correctos en .env.',
    );
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void runMigrations();
