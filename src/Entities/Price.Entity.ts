import 'reflect-metadata';
import { Convertible, asEntity, formatHash, hexToStr, type CS, type TN } from '../Commons/index.js';
import { BaseEntity } from './Base/Base.Entity.js';
import { type SignedMessage } from 'lucid-cardano';

@asEntity()
export class PriceEntity extends BaseEntity {
    protected static _apiRoute: string = 'prices';
    protected static _className: string = 'Oracle Price';

    // #region fields

    @Convertible({})
    CS!: CS;

    @Convertible({})
    TN_Hex!: TN;

    @Convertible({})
    TN_Str!: TN;

    @Convertible({})
    date!: Date;

    @Convertible({})
    priceADAx1e6!: bigint;

    @Convertible({})
    signature!: SignedMessage;

    // #endregion fields

    
    // #region  db

    public static defaultFieldsWhenUndefined: Record<string, boolean> = {};

    public static alwaysFieldsForSelect: Record<string, boolean> = {
        ...super.alwaysFieldsForSelect,
        CS: true,
        TN_Hex: true,
        TN_Str: true,
        priceADAx1e6: true,
    };

    // #endregion  db

    // #region class methods
    
    public show(): string {
        return `${formatHash(this.CS)}, ${hexToStr(this.TN_Hex)}: ${this.priceADAx1e6}`;
    }

    // #endregion class methods

}
