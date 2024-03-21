import { isFrontEndEnvironment } from '@/src/utils/commons/utils';
import { CascadeUpdate, Token_With_Metadata_And_Amount, TokensWithMetadataAndAmount } from '../Commons';
import { BackEndAppliedFor } from '../Commons/Decorator.BackEndAppliedFor';
import { console_log, tabs } from '../Commons/BackEnd/globalLogs';
import { BaseEntity } from '../Entities/Base/Base.Entity';
import { SmartUTxOWithDetailsEntity } from '../Entities/SmartUTxO.WithDetails.Entity';
import { BaseBackEndMethods } from './Base/Base.BackEnd.Methods';
import { SmartUTxOBackEndApplied } from './SmartUTxO.BackEnd.Applied';
import { TokenMetadataBackEndApplied } from './Token.Metadata.BackEnd.All';
import { TokenMetadataEntity } from '../Entities/Token.Metadata.Entity';

@BackEndAppliedFor(SmartUTxOWithDetailsEntity)
export class SmartUTxOWithDetailsBackEndApplied extends SmartUTxOBackEndApplied {
    protected static _Entity = SmartUTxOWithDetailsEntity;
    protected static _BackEndMethods = BaseBackEndMethods;

    // #region class methods

    public static async loadMetadata<T extends SmartUTxOWithDetailsEntity>(instance: T) {
        //----------------------------
        if (isFrontEndEnvironment()) {
            //return await this.loadMetadataApi();
            throw `Can't run this method in the Browser`;
        }
        //----------------------------
        const assets = instance.assets;
        const assetsWithDetails: TokensWithMetadataAndAmount = [];
        for (const [key, value] of Object.entries(assets)) {
            const CS = key.slice(0, 56);
            const TN = key.slice(56);
            const tokenMetadata: TokenMetadataEntity | undefined = await TokenMetadataBackEndApplied.get_Token_Metadata(CS, TN);
            const assetDetails: Token_With_Metadata_And_Amount = {
                CS: CS,
                TN: TN,
                amount: value,
                decimals: tokenMetadata?.decimals ?? 0,
                image: tokenMetadata?.image,
                colorHex: tokenMetadata?.colorHex,
                metadata_raw: tokenMetadata?.metadata_raw,
            };
            assetsWithDetails.push(assetDetails);
        }
        instance.assetsWithDetails = assetsWithDetails;
    }

    // #endregion class methods
    // #region callbacks

    public static async callbackOnAfterLoad<T extends BaseEntity>(instance: T, cascadeUpdate: CascadeUpdate): Promise<CascadeUpdate> {
        //--------------------------------------
        console_log(1, this._Entity.className(), `callbackOnAfterLoad - Init`);
        //--------------------------------------
        const smartUTxOInstance = instance as unknown as SmartUTxOWithDetailsEntity;
        //--------------------------------------
        cascadeUpdate = await super.callbackOnAfterLoad(smartUTxOInstance, cascadeUpdate);
        //--------------------------------------
        await this.loadMetadata(smartUTxOInstance);
        //--------------------------------------
        console_log(-1, this._Entity.className(), `callbackOnAfterLoad  - OK`);
        //-------------------------------------
        return cascadeUpdate;
    }

    // #endregion callbacks
}
