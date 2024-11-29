import type { PaymentKeyHash, StakeKeyHash } from 'lucid-cardano';
import { getPostgreSQLTableName, Maybe, PostgreSQLAppliedFor } from 'smart-db';
import { BaseEntityPostgreSQL } from 'smart-db/backEnd';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { CustomWalletEntity } from './CustomWallet.Entity';

@PostgreSQLAppliedFor([CustomWalletEntity])
@Entity(getPostgreSQLTableName(CustomWalletEntity.className()))
export class CustomWalletEntityPostgreSQL extends BaseEntityPostgreSQL {
    protected static Entity = CustomWalletEntity;

    // #region fields

    @PrimaryGeneratedColumn()
    _id!: number; // Asume que cada registro tiene un ID autogenerado

    @Column({ type: 'varchar', nullable: true })
    custom?: string;

    @Column({ type: 'timestamptz', nullable: true })
    createdAt?: Date;

    @Column({ type: 'varchar', nullable: true })
    createdBy?: string;

    @Column({ type: 'timestamptz', nullable: true })
    lastConnection?: Date;

    @Column({ type: 'varchar', nullable: true })
    walletUsed?: string;

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

    // #endregion fields

    // #region internal class methods

    public getPostgreSQLStatic(): typeof CustomWalletEntityPostgreSQL {
        return this.constructor as typeof CustomWalletEntityPostgreSQL;
    }

    public static getPostgreSQLStatic(): typeof CustomWalletEntityPostgreSQL {
        return this as typeof CustomWalletEntityPostgreSQL;
    }

    public getStatic(): typeof CustomWalletEntity {
        return this.getPostgreSQLStatic().getStatic() as typeof CustomWalletEntity;
    }

    public static getStatic(): typeof CustomWalletEntity {
        return this.Entity as typeof CustomWalletEntity;
    }

    public className(): string {
        return this.getStatic().className();
    }

    public static className(): string {
        return this.getStatic().className();
    }

    // #endregion internal class methods
}
