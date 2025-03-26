import 'reflect-metadata';
import { Convertible, asEntity, type CS, type TN } from '../Commons/index.js';
import { BaseEntity } from './Base/Base.Entity.js';

@asEntity()
export class AddressToFollowEntity extends BaseEntity {
    protected static _apiRoute: string = 'addressestofollow';
    protected static _className: string = 'Address To Follow';

    // #region fields

    @Convertible()
    address!: string;

    @Convertible()
    CS!: CS;

    @Convertible()
    TN_Str!: TN;

    @Convertible()
    txCount!: number;

    @Convertible()
    apiRouteToCall!: string;

    @Convertible()
    datumType!: string;

    @Convertible({ isCreatedAt: true })
    createdAt!: Date;

    @Convertible({ isUpdatedAt: true })
    updatedAt!: Date;
    
    // #endregion fields

   
}
