import 'reflect-metadata';
import { Convertible, OptionsGet, asEntity, optionsGetMinimal, type CS, type Decimals, type TN } from '../Commons';
import { BaseEntity } from './Base/Base.Entity';

@asEntity()
export class TokenMetadataEntity extends BaseEntity {
    protected static _apiRoute: string = 'token-metadata';
    protected static _className: string = 'Token Metadata';

    // #region fields

    @Convertible({})
    CS!: CS;

    @Convertible({})
    TN_Hex!: TN;

    @Convertible({})
    TN_Str!: TN;

    @Convertible({ type: Number })
    decimals!: Decimals;

    @Convertible({})
    image!: string;

    @Convertible({})
    colorHex!: string;

    @Convertible({})
    metadata_raw!: Record<string, any>;

    @Convertible({})
    swMetadataGenerated!: boolean;

    // #endregion fields

    // #region db

    public static optionsGetForTokenStore: OptionsGet = {
        ...optionsGetMinimal,
        fieldsForSelect: { CS: true, TN_Hex: true, decimals: true, image: true, colorHex: true },
    };

    // #endregion db
}
