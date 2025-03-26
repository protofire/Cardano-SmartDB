import type { OutRef, PaymentKeyHash, UTxO } from '@lucid-evolution/lucid';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PostgreSQLDatabaseService } from '../BackEnd/DatabaseService/PostgreSQL.Database.Service.js';
import { PostgreSQLAppliedFor } from '../Commons/Decorators/Decorator.PostgreSQLAppliedFor.js';
import { TransactionDatum, TransactionRedeemer } from '../Commons/index.js';
import { BaseEntityPostgreSQL } from './Base/Base.Entity.PostgreSQL.js'; // Assuming you have a BaseEntityPostgreSQL class
import { TransactionEntity } from './Transaction.Entity.js'; // Assuming TransactionEntity is implemented in TypeORM

@PostgreSQLAppliedFor([TransactionEntity])
@Entity({ name: PostgreSQLDatabaseService.getTableName(TransactionEntity.className()) })
@Index(['paymentPKH', 'date'])
@Index(['type', 'date'])
@Index(['status', 'date'])
@Index(['hash', 'date'])
export class TransactionEntityPostgreSQL extends BaseEntityPostgreSQL {
    protected static Entity = TransactionEntity;

    // #region internal class methods

    public getPostgreSQLStatic(): typeof TransactionEntityPostgreSQL {
        return this.constructor as typeof TransactionEntityPostgreSQL;
    }

    public static getPostgreSQLStatic(): typeof TransactionEntityPostgreSQL {
        return this as typeof TransactionEntityPostgreSQL;
    }

    public getStatic(): typeof TransactionEntity {
        return this.getPostgreSQLStatic().getStatic() as typeof TransactionEntity;
    }

    public static getStatic(): typeof TransactionEntity {
        return this.Entity as typeof TransactionEntity;
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
    _id!: number; // ID auto-generado

    @Column({ type: 'varchar', nullable: true })
    @Index()
    hash!: string;

    @Column({ type: 'varchar', nullable: false })
    @Index()
    paymentPKH!: PaymentKeyHash;

    @Column({ type: 'timestamptz', nullable: false })
    @Index()
    date!: Date;

    @Column({ type: 'varchar', nullable: false })
    @Index()
    type!: string;

    @Column({ type: 'varchar', nullable: false })
    @Index()
    status!: string;

    @Column({ type: 'jsonb', nullable: true })
    error!: Object | undefined;

    @Column({ type: 'varchar', nullable: true })
    parse_info!: string;

    @Column({ type: 'jsonb', nullable: true })
    ids!: Record<string, string | undefined>;

    @Column({ type: 'jsonb', nullable: true })
    redeemers!: Record<string, TransactionRedeemer>;

    @Column({ type: 'jsonb', nullable: true })
    datums!: Record<string, TransactionDatum>;

    @Column({ type: 'jsonb', nullable: true })
    consuming_UTxOs!: UTxO[];

    @Column({ type: 'jsonb', nullable: true })
    reading_UTxOs!: UTxO[];

    @Column({ type: 'bigint', nullable: true })
    valid_from?: bigint;

    @Column({ type: 'bigint', nullable: true })
    valid_until?: bigint;

    @Column({ type: 'bigint', nullable: true })
    unit_mem?: bigint;

    @Column({ type: 'bigint', nullable: true })
    unit_steps?: bigint;

    @Column({ type: 'bigint', nullable: true })
    fee?: bigint;

    @Column({ type: 'int', nullable: true })
    size?: number;

    @Column({ type: 'varchar', nullable: true })
    CBORHex?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // #endregion fields
}
