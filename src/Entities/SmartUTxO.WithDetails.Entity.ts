import 'reflect-metadata';
import { asEntity, Convertible, type TokensWithMetadataAndAmount } from '../Commons/index.js';
import { deserealizeTokenWithMetadataAndAmount } from '../Commons/conversions.js';
import { SmartUTxOEntity } from './SmartUTxO.Entity.js';

@asEntity()
export class SmartUTxOWithDetailsEntity extends SmartUTxOEntity {
    protected static _apiRoute: string = 'smartutxos-with-details';
    protected static _className: string = 'SmartUTxO With Details';

    // #region fields

    @Convertible({
        type: Object,
        isArray: true,
        fromPlainObject: deserealizeTokenWithMetadataAndAmount,
    })
    assetsWithDetails!: TokensWithMetadataAndAmount;

    // #endregion fields

    // #region db

    public static alwaysFieldsForCallbackOnAfterLoad: Record<string, boolean> = {
        ...super.alwaysFieldsForCallbackOnAfterLoad,
        assets: true,
    };

    // #endregion db
}
