import { BaseEntityPostgreSQL, getPostgreSQLTableName, PostgreSQLAppliedFor } from 'smart-db/backEnd';
import { ProductNoOptEntity } from './ProductNoOpt.Entity';

import { Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@PostgreSQLAppliedFor([ProductNoOptEntity])
@Entity({ name: getPostgreSQLTableName(ProductNoOptEntity.className()) })
export class ProductNoOptEntityPostgreSQL extends BaseEntityPostgreSQL {
    protected static Entity = ProductNoOptEntity;

    // #region internal class methods

    public getPostgreSQLStatic(): typeof ProductNoOptEntityPostgreSQL {
        return this.constructor as typeof ProductNoOptEntityPostgreSQL;
    }

    public static getPostgreSQLStatic(): typeof ProductNoOptEntityPostgreSQL {
        return this as typeof ProductNoOptEntityPostgreSQL;
    }

    public getStatic(): typeof ProductNoOptEntity {
        return ProductNoOptEntityPostgreSQL.getPostgreSQLStatic().getStatic() as typeof ProductNoOptEntity;
    }

    public static getStatic(): typeof ProductNoOptEntity {
        return this.Entity as typeof ProductNoOptEntity;
    }

    public className(): string {
        return this.getStatic().className();
    }

    public static className(): string {
        return this.getStatic().className();
    }

    @PrimaryGeneratedColumn()
    _id!: number;

    @Column()
    name!: string;

    @Column()
    description!: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price!: number;

    @Column()
    stock!: number;

    @Column()
    category!: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;
}
