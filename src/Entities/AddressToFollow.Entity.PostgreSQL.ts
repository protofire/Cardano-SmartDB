import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { PostgreSQLAppliedFor } from '../Commons/Decorators/Decorator.PostgreSQLAppliedFor.js';
import { BaseEntityPostgreSQL } from './Base/Base.Entity.PostgreSQL.js';
import { AddressToFollowEntity } from './AddressToFollow.Entity.js';

@PostgreSQLAppliedFor([AddressToFollowEntity])
@Entity()
export class AddressToFollowEntityPostgreSQL extends BaseEntityPostgreSQL {
  protected static Entity = AddressToFollowEntity;

  // #region internal class methods

  public getPostgreSQLStatic(): typeof AddressToFollowEntityPostgreSQL {
    return this.constructor as typeof AddressToFollowEntityPostgreSQL;
  }

  public static getPostgreSQLStatic(): typeof AddressToFollowEntityPostgreSQL {
    return this as typeof AddressToFollowEntityPostgreSQL;
  }

  public getStatic(): typeof AddressToFollowEntity {
    return this.getPostgreSQLStatic().getStatic() as typeof AddressToFollowEntity;
  }

  public static getStatic(): typeof AddressToFollowEntity {
    return this.Entity as typeof AddressToFollowEntity;
  }

  public className(): string {
    return this.getStatic().name;
  }

  public static className(): string {
    return this.getStatic().name;
  }

  // #endregion internal class methods

  // #region postgreSQLDB

  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  address!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  currencySymbol!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tokenName!: string;

  @Column({ nullable: true })
  txCount!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  apiRouteToCall!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  datumType!: string;

  public static PostgreSQLModel() {
    return this;
  }
  // #endregion postgreSQLDB
}
