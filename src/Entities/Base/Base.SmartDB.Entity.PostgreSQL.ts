import 'reflect-metadata';
import { Entity, Column, Index, ManyToOne, JoinColumn, RelationId } from 'typeorm';
import type { PaymentKeyHash } from '@lucid-evolution/lucid';
import { BaseEntityPostgreSQL } from './Base.Entity.PostgreSQL.js';  // Usa la base de TypeORM para PostgreSQL
import { SmartUTxOEntityPostgreSQL } from '../SmartUTxO.Entity.PostgreSQL.js';

@Entity('base_smart_db_entities')
@Index(['_creator', '_NET_address', '_NET_id_CS', '_NET_id_TN_Str'])  // Indexes can be adjusted as needed
export class BaseSmartDBEntityPostgreSQL extends BaseEntityPostgreSQL {

    @Column({ type: 'varchar', length: 255, nullable: true  })
    _creator!: PaymentKeyHash;

    @Column({ type: 'varchar', length: 255, nullable: true  })
    _NET_address!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    _NET_id_CS?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    _NET_id_TN_Str?: string;

    @Column({ type: 'boolean', default: true, nullable: true  })
    _isDeployed!: boolean;

    @ManyToOne(() => SmartUTxOEntityPostgreSQL, { nullable: true })
    @JoinColumn({ name: 'smartUTxO_id' })
    smartUTxO?: SmartUTxOEntityPostgreSQL;  // Define the relation if needed

    @RelationId((relatedEntity: BaseSmartDBEntityPostgreSQL) => relatedEntity.smartUTxO)
    smartUTxO_id!: number;

    // Other methods and logic as needed
}

