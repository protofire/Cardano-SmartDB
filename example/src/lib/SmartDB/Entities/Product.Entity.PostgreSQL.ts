import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ProductEntity } from './Product.Entity';
import { PostgreSQLAppliedFor, getPostgreSQLTableName } from 'smart-db';
import { BaseEntityPostgreSQL  } from 'smart-db/backEnd';

@PostgreSQLAppliedFor([ProductEntity])
@Entity({ name: getPostgreSQLTableName(ProductEntity.className()) })
@Index([]) // Add indices as needed
export class ProductEntityPostgreSQL extends BaseEntityPostgreSQL  {
    protected static Entity = ProductEntity;

    // #region internal class methods

    public getPostgreSQLStatic(): typeof ProductEntityPostgreSQL {
        return this.constructor as typeof ProductEntityPostgreSQL;
    }

    public static getPostgreSQLStatic(): typeof ProductEntityPostgreSQL {
        return this as typeof ProductEntityPostgreSQL;
    }

    public getStatic(): typeof ProductEntity {
        return ProductEntityPostgreSQL.getPostgreSQLStatic().getStatic() as typeof ProductEntity;
    }

    public static getStatic(): typeof ProductEntity {
        return this.Entity as typeof ProductEntity;
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
    _id!: number; // Auto-generated primary key

    @Column({ type: "varchar", length: 255 , nullable: true })
    name?:string;
    @Column({ type: "varchar", length: 255  })
    description!:string;
    @Column({ type: "int"  })
    precio!:number;

    public static PostgreSQLModel() {
        return this;
    }
    // #endregion fields
}
