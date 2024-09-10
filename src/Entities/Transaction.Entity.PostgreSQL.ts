
import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { PostgreSQLAppliedFor } from "../Commons/Decorators/Decorator.PostgreSQLAppliedFor.js";
import { TransactionEntity } from './Transaction.Entity.js';  // Assuming TransactionEntity is implemented in TypeORM
import { BaseEntityPostgreSQL } from "./Base/Base.Entity.PostgreSQL.js";  // Assuming you have a BaseEntityPostgreSQL class

import type { PaymentKeyHash, UTxO} from "lucid-cardano";
import { TransactionDatum, TransactionRedeemer } from '../Commons/index.js';

@PostgreSQLAppliedFor([TransactionEntity])
@Entity()
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
    id!: number;  // ID auto-generado

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

    @Column({ type: 'varchar', nullable: false })
    @Index()
    hash!: string;

    @Column({ type: 'jsonb', nullable: false })
    ids!: Record<string, string>;

    @Column({ type: 'jsonb', nullable: false })
    redeemers!: Record<string, TransactionRedeemer>;

    @Column({ type: 'jsonb', nullable: false })
    datums!: Record<string, TransactionDatum>;

    @Column({ type: 'jsonb', nullable: true })
    consuming_UTxOs!: UTxO[] | undefined;

    // #endregion fields
}

