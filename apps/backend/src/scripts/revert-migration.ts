import dataSource from '../database/data-source';

async function revertMigration() {
  try {
    await dataSource.initialize();
    await dataSource.undoLastMigration();
    console.log('Migración revertida correctamente.');
  } catch (error) {
    console.error('Error revirtiendo migración:', error);
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void revertMigration();
