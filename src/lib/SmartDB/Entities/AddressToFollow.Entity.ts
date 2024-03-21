import 'reflect-metadata';
import { Convertible, asEntity, type CS, type TN } from '../Commons';
import { BaseEntity } from './Base/Base.Entity';

@asEntity()
export class AddressToFollowEntity extends BaseEntity {
    protected static _apiRoute: string = 'addressestofollow';
    protected static _className: string = 'Address To Follow';

    // #region fields

    @Convertible()
    address!: string;

    @Convertible()
    currencySymbol!: CS;

    @Convertible()
    tokenName!: TN;

    @Convertible()
    txCount!: number;

    @Convertible()
    apiRouteToCall!: string;

    @Convertible()
    datumType!: string;

    // #endregion fields

   
}
