import { type PaymentKeyHash } from 'lucid-cardano';
import 'reflect-metadata';
import { BaseSmartDBEntity, asSmartDBEntity } from '../../SmartDB';


@asSmartDBEntity()
export class ExampleEntity extends BaseSmartDBEntity {
    protected static _apiRoute: string = 'examples';
    protected static _className: string = 'Example';

    protected static _plutusDataIndex = 0;
    protected static _is_NET_id_Unique = false;

    // #region fields

    _NET_id_TN: string = DELEGATION_ID_TN;

    // #endregion fields

    // #region datum

    // ddDelegated_Mayz  :: Integer
    // ddMinADA              :: Integer

    @Convertible({ isForDatum: true })
    ddDelegationPolicyID_CS!: CS;

    @Convertible({ isForDatum: true })
    ddFundPolicy_CS!: CS;

    @Convertible({ isForDatum: true })
    ddDelegatorPaymentPKH!: PaymentKeyHash;

    @Convertible({ isForDatum: true, type: Maybe<StakeCredentialPubKeyHash> })
    ddDelegatorStakePKH!: Maybe<StakeCredentialPubKeyHash>;

    @Convertible({ isForDatum: true })
    ddDelegated_Mayz!: bigint;

    @Convertible({ isForDatum: true })
    ddMinADA!: bigint;

    // #endregion datum

    // #region  db

    public static defaultFieldsWhenUndefined: Record<string, boolean> = {};

    public static alwaysFieldsForSelect: Record<string, boolean> = {
        ...super.alwaysFieldsForSelect,
        ddDelegationPolicyID_CS: true,
        ddFundPolicy_CS: true,
        ddDelegatorPaymentPKH: true,
        ddDelegatorStakePKH: true,
        ddDelegated_Mayz: true,
        ddMinADA: true,
    };

    // #endregion  db

    // #region class methods

    public getNET_id_CS(): string {
        return this.ddDelegationPolicyID_CS;
    }

    // #endregion class methods
}
