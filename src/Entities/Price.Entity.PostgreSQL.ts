import type { SignedMessage } from 'lucid-cardano';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { PostgreSQLAppliedFor } from '../Commons/Decorators/Decorator.PostgreSQLAppliedFor.js';
import type { CS, TN } from '../Commons/index.js';
import { getPostgreSQLTableName } from '../Commons/utils.js';
import { BaseEntityPostgreSQL } from './Base/Base.Entity.PostgreSQL.js';
import { PriceEntity } from './Price.Entity.js';

@PostgreSQLAppliedFor([PriceEntity])
@Entity({ name: getPostgreSQLTableName(PriceEntity.className()) })
export class PriceEntityPostgreSQL extends BaseEntityPostgreSQL {
    protected static Entity = PriceEntity;

    // #region internal class methods

    public getPostgreSQLStatic(): typeof PriceEntityPostgreSQL {
        return this.constructor as typeof PriceEntityPostgreSQL;
    }

    public static getPostgreSQLStatic(): typeof PriceEntityPostgreSQL {
        return this as typeof PriceEntityPostgreSQL;
    }

    /**
     * Returns the static instance of PriceEntity for this class.
     */
    public getStatic(): typeof PriceEntity {
        return PriceEntityPostgreSQL.getStatic();
    }

    /**
     * Static method to get the PriceEntity definition.
     */
    public static getStatic(): typeof PriceEntity {
        return this.Entity as typeof PriceEntity;
    }

    /**
     * Returns the class name of the entity.
     */
    public className(): string {
        return this.getStatic().className();
    }

    /**
     * Static method to get the class name.
     */
    public static className(): string {
        return this.getStatic().className();
    }

    // #endregion internal class methods

    // #region fields

    @PrimaryGeneratedColumn()
    i_d!: number; // Auto-generated primary key

    @Column({ type: 'varchar', nullable: true })
    CS!: CS; // Currency Symbol (adapted from MongoDB schema)

    @Column({ type: 'varchar', nullable: true })
    TN_Hex!: TN; // Token Name (Hex)

    @Column({ type: 'varchar', nullable: true })
    TN_Str!: TN; // Token Name (String)

    @Column({ type: 'timestamp', nullable: true })
    date!: Date; // Date of the price entry

    @Column({ type: 'bigint', nullable: true })
    priceADAx1e6!: bigint; // Price of the token in ADA, multiplied by 1e6

    @Column({ type: 'jsonb', nullable: true })
    signature!: SignedMessage; // Signature of the price data

    // #endregion fields
}
