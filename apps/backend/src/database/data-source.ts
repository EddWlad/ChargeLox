import { DataSource } from 'typeorm';
import { getDataSourceOptions } from './database.config';

const dataSource = new DataSource({
  ...getDataSourceOptions(),
  migrations: ['src/database/migrations/*.ts'],
});

export default dataSource;
