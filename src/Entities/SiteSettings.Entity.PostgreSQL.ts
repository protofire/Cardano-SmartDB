import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { PostgreSQLAppliedFor } from "../Commons/Decorators/Decorator.PostgreSQLAppliedFor.js";
import { BaseEntityPostgreSQL } from "./Base/Base.Entity.PostgreSQL.js";
import { SiteSettingsEntity } from "./SiteSettings.Entity.js";


@PostgreSQLAppliedFor([SiteSettingsEntity])
@Entity()
export class SiteSettingsEntityPostgreSQL extends BaseEntityPostgreSQL {
    protected static Entity = SiteSettingsEntity;

    // #region internal class methods

    public getPostgreSQLStatic(): typeof SiteSettingsEntityPostgreSQL {
        return this.constructor as typeof SiteSettingsEntityPostgreSQL;
    }

    public static getPostgreSQLStatic(): typeof SiteSettingsEntityPostgreSQL {
        return this as typeof SiteSettingsEntityPostgreSQL;
    }

    public getStatic(): typeof SiteSettingsEntity {
        return this.getPostgreSQLStatic().getStatic() as typeof SiteSettingsEntity;
    }

    public static getStatic(): typeof SiteSettingsEntity {
        return this.Entity as typeof SiteSettingsEntity;
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

    @Column({ type: "varchar", length: 255, nullable: false })
    name!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    siteSecret!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    corsAllowedOrigin!: string;

    @Column({ type: "boolean", nullable: true })
    debug!: boolean;

    @Column({ type: "varchar", length: 255, nullable: true })
    welcomeMessage!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    welcomeMessageIndex!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    blockfrost_url_api_mainnet!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    blockfrost_url_explorer_mainnet!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    blockfrost_url_api_preview!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    blockfrost_url_explorer_preview!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    blockfrost_url_api_preprod!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    blockfrost_url_explorer_preprod!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    oracle_wallet_publickey!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    oracle_internal_wallet_publickey_cborhex!: string;


        // #endregion postgreSQLDB
}
