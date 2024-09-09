import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';
import { PostgreSQLAppliedFor } from "../Commons/Decorators/Decorator.PostgreSQLApplliedFor.js";
import { BaseEntityPostgreSQL } from "./Base/Base.Entity.PostgreSQL.js";  // Change the base class to the TypeORM version
import { JobEntity } from './Job.Entity.js';  // Assuming JobEntity is implemented in TypeORM

@PostgreSQLAppliedFor([JobEntity])
@Entity()
export class JobEntityPostgreSQL extends BaseEntityPostgreSQL {
    protected static Entity = JobEntity;

    // #region internal class methods

    public getPostgreSQLStatic(): typeof JobEntityPostgreSQL {
        return this.constructor as typeof JobEntityPostgreSQL;
    }

    public static getPostgreSQLStatic(): typeof JobEntityPostgreSQL {
        return this as typeof JobEntityPostgreSQL;
    }


    /**
     * Returns the static instance of JobEntity for this class.
     */
    public getStatic(): typeof JobEntity {
        return JobEntityPostgreSQL.getStatic();
    }

    /**
     * Static method to get the JobEntity definition.
     */
    public static getStatic(): typeof JobEntity {
        return this.Entity as typeof JobEntity;
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
    id!: number;  // Assumes the entity has an auto-generated ID column

    @Column({ type: 'varchar', nullable: true })
    name!: string;

    @Column({ type: 'varchar', nullable: true })
    status!: string;

    @Column({ type: 'varchar', nullable: true })
    message!: string;

    @Column({ type: 'boolean', nullable: true })
    result!: boolean;

    @Column({ type: 'varchar', nullable: true })
    error!: string;

    // #endregion fields
}

