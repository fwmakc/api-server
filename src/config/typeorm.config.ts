import * as dotenv from 'dotenv';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenv.config();

const ENTITIES = [join(__dirname, '../**/*.entity{.ts,.js}')];
const MIGRATIONS = [join(__dirname, '../typeorm/migrations/*{.ts,.js}')];

export const AppDataSource = new DataSource({
  type: process.env.DB_TYPE as any,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  schema: process.env.DB_SCHEMA,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  entities: ENTITIES,
  migrations: MIGRATIONS,
  migrationsTableName: 'migrations_typeorm',
} as DataSourceOptions);

export default AppDataSource;
