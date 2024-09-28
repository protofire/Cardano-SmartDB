import 'reflect-metadata';
import { BaseSmartDBEntity, Convertible, asSmartDBEntity, toJson } from 'smart-db';
import { } from 'lucid-cardano';

@asSmartDBEntity()
export class FreeEntity extends BaseSmartDBEntity {
    protected static _apiRoute: string = 'free';
    protected static _className: string = 'Free';

    protected static _plutusDataIndex = 0;
    protected static _is_NET_id_Unique = false;
    
    // #region fields

    _NET_id_TN: string = 'FreeID';

    @Convertible({ isForDatum: true })
    fdValue!: bigint;

    // #endregion fields

    // #region db

    public static defaultFieldsWhenUndefined: Record<string, boolean> = {};
    
    public static alwaysFieldsForSelect: Record<string, boolean> = {
        ...BaseSmartDBEntity.alwaysFieldsForSelect,
        fdValue: true,
    };

    // #endregion db
}

