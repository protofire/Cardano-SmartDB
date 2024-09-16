import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { PostgreSQLAppliedFor } from 'smart-db';
import { BaseSmartDBEntityPostgreSQL } from 'smart-db/backEnd';
import { DummyEntity } from './Dummy.Entity';
import type { PaymentKeyHash } from 'lucid-cardano';
import { Maybe } from 'smart-db';


@PostgreSQLAppliedFor([DummyEntity])
@Entity({ name: DummyEntity.className() }) // Nombre de la tabla basado en el nombre de la clase
@Index(["ddPaymentPKH"])  // Puedes agregar más índices si es necesario
export class DummyEntityPostgreSQL extends BaseSmartDBEntityPostgreSQL {
    protected static Entity = DummyEntity;

    // #region fields

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', nullable: true })
    ddPaymentPKH?: PaymentKeyHash;

    @Column({ type: 'varchar', nullable: true })
    ddStakePKH?: Maybe<PaymentKeyHash>;

    @Column({ type: 'varchar', nullable: true })
    ddValue?: string;

    // #endregion fields

    // #region internal class methods

    public getPostgreSQLStatic(): typeof DummyEntityPostgreSQL {
        return this.constructor as typeof DummyEntityPostgreSQL;
    }

    public static getPostgreSQLStatic(): typeof DummyEntityPostgreSQL {
        return this as typeof DummyEntityPostgreSQL;
    }

    public getStatic(): typeof DummyEntity {
        return this.getPostgreSQLStatic().getStatic() as typeof DummyEntity;
    }

    public static getStatic(): typeof DummyEntity {
        return this.Entity as typeof DummyEntity;
    }

    public className(): string {
        return this.getStatic().className();
    }

    public static className(): string {
        return this.getStatic().className();
    }

    // #endregion internal class methods
}

