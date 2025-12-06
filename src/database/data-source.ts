import { DataSource } from 'typeorm';
import * as entities from './entities';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/teach_mini_app',
  entities: Object.values(entities),
  synchronize: true,
  logging: process.env.NODE_ENV !== 'production',
});

