import type { PaymentKeyHash, StakeKeyHash } from '@lucid-evolution/lucid';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PostgreSQLDatabaseService } from '../BackEnd/DatabaseService/PostgreSQL.Database.Service.js';
import { PostgreSQLAppliedFor } from '../Commons/Decorators/Decorator.PostgreSQLAppliedFor.js';
import { BaseEntityPostgreSQL } from './Base/Base.Entity.PostgreSQL.js';
import { WalletEntity } from './Wallet.Entity.js';

@PostgreSQLAppliedFor([WalletEntity])
@Entity({ name: PostgreSQLDatabaseService.getTableName(WalletEntity.className()) })
export class WalletEntityPostgreSQL extends BaseEntityPostgreSQL {
    protected static Entity = WalletEntity;

    // #region fields

    @PrimaryGeneratedColumn()
    _id!: number; // Asume que cada registro tiene un ID autogenerado

    @Column({ type: 'varchar', nullable: true })
    walletName?: string;

    @Column({ type: 'boolean', nullable: false, default: false })
    walletValidatedWithSignedToken!: boolean;

    @Column({ type: 'varchar', nullable: false })
    @Index()
    paymentPKH!: PaymentKeyHash;

    @Column({ type: 'varchar', nullable: true })
    stakePKH?: StakeKeyHash;

    @Column({ type: 'varchar', nullable: true })
    name?: string;

    @Column({ type: 'varchar', nullable: true })
    email?: string;

    @Column({ type: 'boolean', nullable: false, default: false })
    isCoreTeam!: boolean;

    @Column({ type: 'varchar', nullable: true })
    testnet_address?: string;

    @Column({ type: 'varchar', nullable: true })
    mainnet_address?: string;

    @Column({ type: 'varchar', nullable: true })
    createdBy?: string;

    @Column({ type: 'timestamptz', nullable: true })
    lastConnection?: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // #endregion fields

    // #region internal class methods

    public getPostgreSQLStatic(): typeof WalletEntityPostgreSQL {
        return this.constructor as typeof WalletEntityPostgreSQL;
    }

    public static getPostgreSQLStatic(): typeof WalletEntityPostgreSQL {
        return this as typeof WalletEntityPostgreSQL;
    }

    public getStatic(): typeof WalletEntity {
        return this.getPostgreSQLStatic().getStatic() as typeof WalletEntity;
    }

    public static getStatic(): typeof WalletEntity {
        return this.Entity as typeof WalletEntity;
    }

    public className(): string {
        return this.getStatic().className();
    }

    public static className(): string {
        return this.getStatic().className();
    }

    // #endregion internal class methods
}
