import type { Datum, Script } from '@lucid-evolution/lucid';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PostgreSQLDatabaseService } from '../BackEnd/DatabaseService/PostgreSQL.Database.Service.js';
import { PostgreSQLAppliedFor } from '../Commons/Decorators/Decorator.PostgreSQLAppliedFor.js';
import { BaseEntityPostgreSQL } from './Base/Base.Entity.PostgreSQL.js'; // Change the base class to the TypeORM version
import { SmartUTxOEntity } from './SmartUTxO.Entity.js'; // Assuming SmartUTxOEntity is implemented in TypeORM

@PostgreSQLAppliedFor([SmartUTxOEntity])
@Entity({ name: PostgreSQLDatabaseService.getTableName(SmartUTxOEntity.className()) })
@Index(['txHash', 'outputIndex']) // Composite index
// @Index(['isPreparing', 'isConsuming']) // Additional index
export class SmartUTxOEntityPostgreSQL extends BaseEntityPostgreSQL {
    protected static Entity = SmartUTxOEntity;

    // #region internal class methods

    public getPostgreSQLStatic(): typeof SmartUTxOEntityPostgreSQL {
        return this.constructor as typeof SmartUTxOEntityPostgreSQL;
    }

    public static getPostgreSQLStatic(): typeof SmartUTxOEntityPostgreSQL {
        return this as typeof SmartUTxOEntityPostgreSQL;
    }

    public getStatic(): typeof SmartUTxOEntity {
        return SmartUTxOEntityPostgreSQL.getStatic();
    }

    public static getStatic(): typeof SmartUTxOEntity {
        return this.Entity as typeof SmartUTxOEntity;
    }

    public className(): string {
        return this.getStatic().className();
    }

    public static className(): string {
        return this.getStatic().className();
    }

    // #endregion internal class methods

    // #region fields

    @PrimaryGeneratedColumn()
    _id!: number; // Assumes the entity has an auto-generated ID column

    @Column({ type: 'varchar', nullable: false })
    @Index()
    address!: string;

    @Column({ type: 'varchar', nullable: false })
    txHash!: string;

    @Column({ type: 'int', nullable: false })
    outputIndex!: number;

    @Column({ type: 'timestamptz', nullable: true })
    isPreparingForReading!: Date[];

    @Column({ type: 'timestamptz', nullable: true })
    isReading!: Date[];

    @Column({ type: 'timestamptz', nullable: true })
    isPreparingForConsuming!: Date | undefined;

    @Column({ type: 'timestamptz', nullable: true })
    isConsuming!: Date | undefined;

    @Column({ type: 'jsonb', nullable: false })
    assets!: { [x: string]: string };

    @Column({ type: 'varchar', nullable: true })
    datumHash!: string | undefined;

    @Column({ type: 'jsonb', nullable: true })
    datum!: Datum | undefined;

    @Column({ type: 'jsonb', nullable: true })
    datumObj!: Object | undefined;

    @Column({ type: 'jsonb', nullable: true })
    scriptRef!: Script | undefined;

    @Column({ type: 'varchar', nullable: false })
    _NET_id_CS!: string;

    @Column({ type: 'varchar', nullable: false })
    _NET_id_TN_Str!: string;

    @Column({ type: 'boolean', nullable: false })
    _is_NET_id_Unique!: boolean;

    @Column({ type: 'varchar', nullable: false })
    @Index()
    datumType!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // #endregion fields
}
