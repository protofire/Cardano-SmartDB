import 'reflect-metadata';
import { Convertible, asEntity, formatHash, hexToStr, type CS, type TN } from '../Commons/index.js';
import { BaseEntity } from './Base/Base.Entity.js';
import 'reflect-metadata';

@asEntity()
export class JobEntity extends BaseEntity {
    protected static _apiRoute: string = 'jobs';
    protected static _className: string = 'Jobs';

    // #region fields

    @Convertible()
    name!: string;

    @Convertible()
    status!: 'pending' | 'running' | 'completed' | 'failed' | 'canceled';

    @Convertible()
    message!: string;

    @Convertible()
    result!: boolean;

    @Convertible()
    error!: string;

    @Convertible({ isCreatedAt: true })
    createdAt!: Date;

    @Convertible({ isUpdatedAt: true })
    updatedAt!: Date;

    // #endregion fields
}
