import { BaseEntityPostgreSQL, getPostgreSQLTableName, PostgreSQLAppliedFor } from 'smart-db/backEnd';
import { UserOptEntity } from './UserOpt.Entity';
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from "typeorm";

@PostgreSQLAppliedFor([UserOptEntity])
@Entity({ name: getPostgreSQLTableName(UserOptEntity.className()) })
@Index(["email"], { unique: true }) // Índice único para mejorar la búsqueda por email
export class UserOptEntityPostgreSQL extends BaseEntityPostgreSQL {
    protected static Entity = UserOptEntity;

    // #region internal class methods

    public getPostgreSQLStatic(): typeof UserOptEntityPostgreSQL {
        return this.constructor as typeof UserOptEntityPostgreSQL;
    }

    public static getPostgreSQLStatic(): typeof UserOptEntityPostgreSQL {
        return this as typeof UserOptEntityPostgreSQL;
    }

    public getStatic(): typeof UserOptEntity {
        return UserOptEntityPostgreSQL.getPostgreSQLStatic().getStatic() as typeof UserOptEntity;
    }

    public static getStatic(): typeof UserOptEntity {
        return this.Entity as typeof UserOptEntity;
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
  @Index() // Índice simple para búsquedas frecuentes por nombre
  firstName!: string;

  @Column()
  lastName!: string;

  @Column()
  email!: string;

  @Column({ select: false }) // Excluir del SELECT por defecto
  password!: string;

  @Column()
  birthDate!: Date;

  @CreateDateColumn() // Optimizar manejo de fechas con columnas automáticas
  createdAt!: Date;

  @UpdateDateColumn() // Automático manejo de fechas de actualización
  updatedAt!: Date;
}

