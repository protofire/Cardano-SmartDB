import 'reflect-metadata';
import { Convertible, type TokensWithMetadataAndAmount } from '../Commons';
import { deserealizeTokenWithMetadataAndAmount } from '../Commons/conversions';
import { SmartUTxOEntity } from './SmartUTxO.Entity';

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
