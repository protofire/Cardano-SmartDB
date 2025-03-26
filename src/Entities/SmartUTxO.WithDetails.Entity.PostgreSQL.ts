import { Entity } from 'typeorm';
import { PostgreSQLDatabaseService } from '../BackEnd/DatabaseService/PostgreSQL.Database.Service.js';
import { PostgreSQLAppliedFor } from '../Commons/Decorators/Decorator.PostgreSQLAppliedFor.js';
import { SmartUTxOEntityPostgreSQL } from './SmartUTxO.Entity.PostgreSQL.js';
import { SmartUTxOWithDetailsEntity } from './SmartUTxO.WithDetails.Entity.js'; // Assuming SmartUTxOWithDetailsEntity is implemented in TypeORM

@PostgreSQLAppliedFor([SmartUTxOWithDetailsEntity])
@Entity({ name: PostgreSQLDatabaseService.getTableName(SmartUTxOWithDetailsEntity.className()) })
// @Index(['isPreparing', 'isConsuming']) // Additional index
export class SmartUTxOWithDetailsEntityPostgreSQL extends SmartUTxOEntityPostgreSQL {
    protected static Entity = SmartUTxOWithDetailsEntity;
}
