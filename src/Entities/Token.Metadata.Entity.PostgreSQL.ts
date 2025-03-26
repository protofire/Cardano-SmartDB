import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PostgreSQLDatabaseService } from '../BackEnd/DatabaseService/PostgreSQL.Database.Service.js';
import { PostgreSQLAppliedFor } from '../Commons/Decorators/Decorator.PostgreSQLAppliedFor.js';
import type { CS, TN } from '../Commons/index.js';
import { BaseEntityPostgreSQL } from './Base/Base.Entity.PostgreSQL.js';
import { TokenMetadataEntity } from './Token.Metadata.Entity.js';

@PostgreSQLAppliedFor([TokenMetadataEntity])
@Entity({ name: PostgreSQLDatabaseService.getTableName(TokenMetadataEntity.className()) })
export class TokenMetadataEntityPostgreSQL extends BaseEntityPostgreSQL {
    protected static Entity = TokenMetadataEntity;

    // #region internal class methods

    public getPostgreSQLStatic(): typeof TokenMetadataEntityPostgreSQL {
        return this.constructor as typeof TokenMetadataEntityPostgreSQL;
    }

    public static getPostgreSQLStatic(): typeof TokenMetadataEntityPostgreSQL {
        return this as typeof TokenMetadataEntityPostgreSQL;
    }

    public getStatic(): typeof TokenMetadataEntity {
        return TokenMetadataEntityPostgreSQL.getStatic();
    }

    public static getStatic(): typeof TokenMetadataEntity {
        return this.Entity as typeof TokenMetadataEntity;
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
    _id!: number; // Assuming the entity has an auto-generated ID

    @Column({ type: 'varchar', nullable: true })
    CS!: CS;

    @Column({ type: 'varchar', nullable: true })
    TN_Hex!: TN;

    @Column({ type: 'varchar', nullable: true })
    TN_Str!: TN;

    @Column({ type: 'varchar', nullable: true })
    ticker!: TN;

    @Column({ type: 'int', nullable: true })
    decimals!: number;

    @Column({ type: 'varchar', nullable: true })
    image!: string;

    @Column({ type: 'varchar', nullable: true })
    colorHex!: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata_raw!: object;

    @Column({ type: 'boolean', nullable: true })
    swMetadataGenerated!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // #endregion fields
}
