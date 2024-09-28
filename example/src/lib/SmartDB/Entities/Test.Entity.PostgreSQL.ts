import { BaseEntityPostgreSQL, getPostgreSQLTableName, PostgreSQLAppliedFor } from 'smart-db/backEnd';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { TestEntity } from './Test.Entity';

@PostgreSQLAppliedFor([TestEntity])
@Entity({ name: getPostgreSQLTableName(TestEntity.className()) })
@Index(['name']) // Add indices as needed
export class TestEntityPostgreSQL extends BaseEntityPostgreSQL {
    protected static Entity = TestEntity;

    // #region internal class methods

    public getPostgreSQLStatic(): typeof TestEntityPostgreSQL {
        return this.constructor as typeof TestEntityPostgreSQL;
    }

    public static getPostgreSQLStatic(): typeof TestEntityPostgreSQL {
        return this as typeof TestEntityPostgreSQL;
    }

    public getStatic(): typeof TestEntity {
        return TestEntityPostgreSQL.getPostgreSQLStatic().getStatic() as typeof TestEntity;
    }

    public static getStatic(): typeof TestEntity {
        return this.Entity as typeof TestEntity;
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

    @Column({ type: 'varchar', length: 255, nullable: false })
    name!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    description?: string; // Use nullable if the field is optional

    // #endregion fields
}
