import { DataSource } from 'typeorm';
import {
  AddressToFollowEntityPostgreSQL,
  EmulatorEntityPostgreSQL,
  JobEntityPostgreSQL,
  SiteSettingsEntityPostgreSQL,
  SmartUTxOEntityPostgreSQL,
  TransactionEntityPostgreSQL,
  WalletEntityPostgreSQL,
} from '../../Entities/index.BackEnd.js';

// Define a new DataSource for connecting to the default database (postgres)
const DefaultDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASS,
  database: 'postgres', // default database
  synchronize: false,
  logging: false,
  entities: [],
  subscribers: [],
  migrations: [],
});

export let databasePostgreSQL: DataSource | null = null; // Store the connection pool

export async function connectPostgres(): Promise<void> {
  if (databasePostgreSQL !== null) {
    return; // Already connected
  }

  try {
    const AppDataSource = new DataSource({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASS,
      database: process.env.POSTGRES_DB,
      synchronize: true,
      logging: true,
      entities: [
        AddressToFollowEntityPostgreSQL,
        EmulatorEntityPostgreSQL,
        JobEntityPostgreSQL,
        SiteSettingsEntityPostgreSQL,
        SmartUTxOEntityPostgreSQL,
        TransactionEntityPostgreSQL,
        WalletEntityPostgreSQL,
      ],
      subscribers: [],
      migrations: [],
    });

    // Connect to the default database and create the target database if it doesn't exist
    await DefaultDataSource.initialize();
    const queryRunner = DefaultDataSource.createQueryRunner();
    await queryRunner.connect();
    const dbName = process.env.POSTGRES_DB;

    const dbExists = await queryRunner.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);

    if (dbExists.length === 0) {
      await queryRunner.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database ${dbName} created successfully.`);
    }

    await queryRunner.release();
    await DefaultDataSource.destroy();

    // Now initialize the AppDataSource
    databasePostgreSQL = await AppDataSource.initialize();
    console.log('postgres: Conexión exitosa a la base de datos');

    // Simple query to test connection
    await databasePostgreSQL.query('SELECT NOW()');
    console.log('Connected to postgreSQL database');
  } catch (error) {
    console.error('Database connection error: ', error);
    databasePostgreSQL = null; // Reset to null on failure
    throw new Error(`Database connection error: ${error}`);
  }
}

export async function disconnectPostgres(): Promise<void> {
  if (databasePostgreSQL) {
    await databasePostgreSQL.destroy();
    databasePostgreSQL = null;
    console.log('Disconnected from database');
  }
}
