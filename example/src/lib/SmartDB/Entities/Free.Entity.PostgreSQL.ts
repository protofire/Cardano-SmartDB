import { PostgreSQLAppliedFor, getPostgreSQLTableName } from 'smart-db';
import { BaseSmartDBEntityPostgreSQL } from 'smart-db/backEnd';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { FreeEntity } from './Free.Entity';

@PostgreSQLAppliedFor([FreeEntity])
@Entity({ name: getPostgreSQLTableName(FreeEntity.className()) })
export class FreeEntityPostgreSQL extends BaseSmartDBEntityPostgreSQL {
    protected static Entity = FreeEntity;

    // #region fields

    @PrimaryGeneratedColumn()
    _id!: number; // Auto-generated primary key

    @Column({ type: 'int', nullable: true })
    fdValue?: number;

    // #endregion fields

    // #region internal class methods

    public getPostgreSQLStatic(): typeof FreeEntityPostgreSQL {
        return this.constructor as typeof FreeEntityPostgreSQL;
    }

    public static getPostgreSQLStatic(): typeof FreeEntityPostgreSQL {
        return this as typeof FreeEntityPostgreSQL;
    }

    public getStatic(): typeof FreeEntity {
        return FreeEntityPostgreSQL.getPostgreSQLStatic().getStatic() as typeof FreeEntity;
    }

    public static getStatic(): typeof FreeEntity {
        return this.Entity as typeof FreeEntity;
    }

    public className(): string {
        return this.getStatic().className();
    }

    public static className(): string {
        return this.getStatic().className();
    }

    // #endregion internal class methods

    // #region posgresql db

    public static PostgreSQLModel() {
        return this;
    }

    // #endregion posgresql db
}
