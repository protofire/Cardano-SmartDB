import { BaseEntityPostgreSQL, BaseSmartDBEntityPostgreSQL, getPostgreSQLTableName, PostgreSQLAppliedFor } from 'smart-db/backEnd';
import { ProductOptEntity } from './ProductOpt.Entity';
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm";


@PostgreSQLAppliedFor([ProductOptEntity])
@Entity({ name: getPostgreSQLTableName(ProductOptEntity.className()) })
@Index(['name', 'category']) // Índice compuesto
export class ProductOptEntityPostgreSQL extends BaseEntityPostgreSQL {
    @PrimaryGeneratedColumn()
    _id!: number;

    @Column()
    @Index() // Índice individual en el nombre
    name!: string;

    @Column()
    description!: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price!: number;

    @Column()
    stock!: number;

    @Column()
    @Index() // Índice en la categoría
    category!: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;

    @DeleteDateColumn() // Para soft delete
    deletedAt?: Date;
}

