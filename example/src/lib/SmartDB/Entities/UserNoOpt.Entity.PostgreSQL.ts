import { BaseEntityPostgreSQL, getPostgreSQLTableName, PostgreSQLAppliedFor } from 'smart-db/backEnd';
import { UserNoOptEntity } from './UserNoOpt.Entity';

import { Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@PostgreSQLAppliedFor([UserNoOptEntity])
@Entity({ name: getPostgreSQLTableName(UserNoOptEntity.className()) })
export class UserNoOptEntityPostgreSQL extends BaseEntityPostgreSQL {
    protected static Entity = UserNoOptEntity;

    // #region internal class methods

    public getPostgreSQLStatic(): typeof UserNoOptEntityPostgreSQL {
        return this.constructor as typeof UserNoOptEntityPostgreSQL;
    }

    public static getPostgreSQLStatic(): typeof UserNoOptEntityPostgreSQL {
        return this as typeof UserNoOptEntityPostgreSQL;
    }

    public getStatic(): typeof UserNoOptEntity {
        return UserNoOptEntityPostgreSQL.getPostgreSQLStatic().getStatic() as typeof UserNoOptEntity;
    }

    public static getStatic(): typeof UserNoOptEntity {
        return this.Entity as typeof UserNoOptEntity;
    }

    public className(): string {
        return this.getStatic().className();
    }

    public static className(): string {
        return this.getStatic().className();
    }


  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column()
  email!: string;

  @Column()
  password!: string;

  @Column()
  birthDate!: Date;

  @Column()
  createdAt!: Date;

  @Column()
  updatedAt!: Date;

}
