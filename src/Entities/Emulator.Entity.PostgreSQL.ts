import type { PrivateKey } from '@lucid-evolution/lucid';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PostgreSQLAppliedFor } from '../Commons/Decorators/Decorator.PostgreSQLAppliedFor.js';
import { BaseEntityPostgreSQL } from './Base/Base.Entity.PostgreSQL.js';
import { EmulatorEntity } from './Emulator.Entity.js';
import { PostgreSQLDatabaseService } from '../BackEnd/DatabaseService/PostgreSQL.Database.Service.js';

@PostgreSQLAppliedFor([EmulatorEntity])
@Entity({ name: PostgreSQLDatabaseService.getTableName(EmulatorEntity.className()) })
export class EmulatorEntityPostgreSQL extends BaseEntityPostgreSQL {
    protected static Entity = EmulatorEntity;

    // #region internal class methods

    public getStatic(): typeof EmulatorEntity {
        return EmulatorEntityPostgreSQL.getStatic();
    }

    public static getStatic(): typeof EmulatorEntity {
        return this.Entity as typeof EmulatorEntity;
    }

    public className(): string {
        return this.getStatic().className();
    }

    public static className(): string {
        return this.getStatic().className();
    }
    // #region internal class methods

    public getPostgreSQLStatic(): typeof EmulatorEntityPostgreSQL {
        return this.constructor as typeof EmulatorEntityPostgreSQL;
    }

    public static getPostgreSQLStatic(): typeof EmulatorEntityPostgreSQL {
        return this as typeof EmulatorEntityPostgreSQL;
    }
    // #endregion internal class methods

    // #region postgreSQLDB

    @PrimaryGeneratedColumn()
    _id!: number; // Asume que el campo `id` es generado automáticamente

    @Column({ type: 'varchar', unique: true })
    name!: string;

    @Column({ type: 'boolean' })
    current!: boolean;

    //TODO: Maybe a one to one relation its better
    @Column({ type: 'jsonb', nullable: true }) // `jsonb` para almacenar objetos en PostgreSQL
    emulator!: object;

    @Column({ type: 'bigint' })
    zeroTime!: bigint;

    @Column({ type: 'varchar', array: true, nullable: true })
    privateKeys!: PrivateKey[]; // Suponiendo que el array de claves privadas se maneja como texto

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // #endregion postgreSQLDB
}
