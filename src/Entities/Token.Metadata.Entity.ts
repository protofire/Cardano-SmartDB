import 'reflect-metadata';
import { Convertible, OptionsGet, asEntity, getFallbackImageLetters, optionsGetMinimal, type CS, type Decimals, type TN } from '../Commons/index.js';
import { BaseEntity } from './Base/Base.Entity.js';

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

    @Convertible({})
    ticker!: TN;

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

    @Convertible({ isCreatedAt: true })
    createdAt!: Date;

    @Convertible({ isUpdatedAt: true })
    updatedAt!: Date;

    // #endregion fields

    // #region db
    

    public static optionsGetForTokenStore: OptionsGet = {
        ...optionsGetMinimal,
        fieldsForSelect: { CS: true, TN_Hex: true, TN_Str: true, ticker: true, decimals: true, image: true, colorHex: true },
    };

    // #endregion db

    // #region class methods

    public getFallbackImageLetters = (): string => {
        return getFallbackImageLetters(this);
    };

    // #endregion class methods
}
