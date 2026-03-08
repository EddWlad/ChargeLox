import dataSource from '../database/data-source';

async function runMigrations() {
  try {
    await dataSource.initialize();
    await dataSource.runMigrations();
    console.log('Migraciones ejecutadas correctamente.');
  } catch (error) {
    console.error('Error ejecutando migraciones:', error);
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void runMigrations();
