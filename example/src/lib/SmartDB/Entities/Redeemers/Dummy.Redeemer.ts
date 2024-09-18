import { BaseTxRedeemer } from "smart-db";


export type DummyPolicyRedeemer = DummyPolicyRedeemerMintID | DummyPolicyRedeemerBurnID;

export class DummyPolicyRedeemerMintID extends BaseTxRedeemer {
    protected static _plutusDataIndex = 1;
    protected static _plutusDataIsSubType = true;
}

export class DummyPolicyRedeemerBurnID extends BaseTxRedeemer {
    protected static _plutusDataIndex = 2;
    protected static _plutusDataIsSubType = true;
}

export type  DummyValidatorRedeemer = DummyValidatorRedeemerDatumUpdate | DummyValidatorRedeemerClaim;

export class DummyValidatorRedeemerDatumUpdate extends BaseTxRedeemer {
    protected static _plutusDataIndex = 0;
    protected static _plutusDataIsSubType = true;
}

export class DummyValidatorRedeemerClaim extends BaseTxRedeemer {
    protected static _plutusDataIndex = 1;
    protected static _plutusDataIsSubType = true;
}

