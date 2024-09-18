import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ProductoEntity } from './Producto.Entity';
import { PostgreSQLAppliedFor, getPostgreSQLTableName } from 'smart-db';
import { BaseEntityPostgreSQL  } from 'smart-db/backEnd';

@PostgreSQLAppliedFor([ProductoEntity])
@Entity({ name: getPostgreSQLTableName(ProductoEntity.className()) })
@Index(["Product"]) // Add indices as needed
export class ProductoEntityPostgreSQL extends BaseEntityPostgreSQL  {
    protected static Entity = ProductoEntity;

    // #region internal class methods

    public getPostgreSQLStatic(): typeof ProductoEntityPostgreSQL {
        return this.constructor as typeof ProductoEntityPostgreSQL;
    }

    public static getPostgreSQLStatic(): typeof ProductoEntityPostgreSQL {
        return this as typeof ProductoEntityPostgreSQL;
    }

    public getStatic(): typeof ProductoEntity {
        return ProductoEntityPostgreSQL.getPostgreSQLStatic().getStatic() as typeof ProductoEntity;
    }

    public static getStatic(): typeof ProductoEntity {
        return this.Entity as typeof ProductoEntity;
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
