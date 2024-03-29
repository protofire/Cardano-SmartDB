import { type PaymentKeyHash } from 'lucid-cardano';
import 'reflect-metadata';
import { BaseSmartDBEntity, CS, Convertible, Maybe, StakeCredentialPubKeyHash, asSmartDBEntity } from '../../SmartDB';
import { DUMMY_ID_CS, DUMMY_ID_TN } from '@/src/constants/constants';

@asSmartDBEntity()
export class DummyEntity extends BaseSmartDBEntity {
    protected static _apiRoute: string = 'dummy';
    protected static _className: string = 'Dummy';

    protected static _plutusDataIndex = 0;
    protected static _is_NET_id_Unique = false;
    
    // protected static _plutusDataIsSubType = false;

    // #region fields

    _NET_id_TN: string = DUMMY_ID_TN;
    _NET_id_CS: string = DUMMY_ID_CS;

    // #endregion fields

    // #region datum

    @Convertible({ isForDatum: true })
    ddPaymentPKH!: PaymentKeyHash;

    @Convertible({ isForDatum: true, type: Maybe<StakeCredentialPubKeyHash> })
    ddStakePKH!: Maybe<StakeCredentialPubKeyHash>;

    @Convertible({ isForDatum: true })
    ddValue!: BigInt;

    // #endregion datum
}
