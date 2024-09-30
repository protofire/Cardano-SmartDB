import type { OutRef, PaymentKeyHash, UTxO } from 'lucid-cardano';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PostgreSQLAppliedFor } from '../Commons/Decorators/Decorator.PostgreSQLAppliedFor.js';
import { TransactionDatum, TransactionRedeemer } from '../Commons/index.js';
import { getPostgreSQLTableName } from '../Commons/utils.js';
import { BaseEntityPostgreSQL } from './Base/Base.Entity.PostgreSQL.js'; // Assuming you have a BaseEntityPostgreSQL class
import { TransactionEntity } from './Transaction.Entity.js'; // Assuming TransactionEntity is implemented in TypeORM

@PostgreSQLAppliedFor([TransactionEntity])
@Entity(getPostgreSQLTableName(TransactionEntity.className()))
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

    @Column({ type: 'jsonb', nullable: true })
    ids!: Record<string, string>;

    @Column({ type: 'jsonb', nullable: true })
    redeemers!: Record<string, TransactionRedeemer>;

    @Column({ type: 'jsonb', nullable: true })
    datums!: Record<string, TransactionDatum>;

    @Column({ type: 'jsonb', nullable: true })
    consuming_UTxOs!: OutRef[] ;

    @Column({ type: 'jsonb', nullable: true })
    reading_UTxOs!: OutRef[] ;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // #endregion fields
}
