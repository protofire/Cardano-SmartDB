import { BaseTxRedeemer } from "smart-db";


export type FreePolicyRedeemer = FreePolicyRedeemerMintID | FreePolicyRedeemerBurnID;

export class FreePolicyRedeemerMintID extends BaseTxRedeemer {
    protected static _plutusDataIndex = 1;
    protected static _plutusDataIsSubType = true;
}

export class FreePolicyRedeemerBurnID extends BaseTxRedeemer {
    protected static _plutusDataIndex = 2;
    protected static _plutusDataIsSubType = true;
}

export type  FreeValidatorRedeemer = FreeValidatorRedeemerDatumUpdate | FreeValidatorRedeemerClaim;

export class FreeValidatorRedeemerDatumUpdate extends BaseTxRedeemer {
    protected static _plutusDataIndex = 0;
    protected static _plutusDataIsSubType = true;
}

export class FreeValidatorRedeemerClaim extends BaseTxRedeemer {
    protected static _plutusDataIndex = 1;
    protected static _plutusDataIsSubType = true;
}

