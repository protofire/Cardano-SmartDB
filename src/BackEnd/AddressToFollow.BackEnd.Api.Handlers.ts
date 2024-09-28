import { NextApiResponse } from 'next';
import { User } from 'next-auth';
import { BackEndApiHandlersFor, OptionsGet,  RegistryManager,  isEmulator, sanitizeForDatabase, showData, yupValidateOptionsGet } from '../Commons/index.js';
import { globalEmulator } from '../Commons/BackEnd/globalEmulator.js';
import { console_error, console_log } from '../Commons/BackEnd/globalLogs.js';
import { AddressToFollowEntity } from '../Entities/AddressToFollow.Entity.js';
import { NextApiRequestAuthenticated } from '../lib/Auth/types.js';
import { AddressToFollowBackEndApplied } from './AddressToFollow.BackEnd.Applied.js';
import { BaseBackEndApiHandlers } from './Base/Base.BackEnd.Api.Handlers.js';
import { BaseSmartDBBackEndMethods } from './Base/Base.SmartDB.BackEnd.Methods.js';
import { yup }  from '../Commons/yupLocale.js';

//BackEnd Api Handlers siempre llevan seteado la entidad y el backend methods

@BackEndApiHandlersFor(AddressToFollowEntity)
export class AddressToFollowBackEndApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = AddressToFollowEntity;
    protected static _BackEndApplied = AddressToFollowBackEndApplied;

    // #region custom api handlers
    protected static _ApiHandlers: string[] = ['by-address', 'sync-all', 'clean'];

    protected static async executeApiHandlers(command: string, req: NextApiRequestAuthenticated, res: NextApiResponse) {
        //--------------------
        const { query } = req.query;
        //--------------------
        if (this._ApiHandlers.includes(command) && query !== undefined) {
            if (query[0] === 'by-address') {
                if (query.length === 2) {
                    req.query = { address: query[1] };
                } else {
                    req.query = {};
                }
                return await this.getByAddressApiHandler(req, res);
            } else if (query[0] === 'sync-all') {
                return await this.syncAllApiHandler(req, res);
            } else if (query[0] === 'clean') {
                return await this.cleanApiHandler(req, res);
            } else {
                console_error(-1, this._Entity.className(), `executeApiHandlers - Error: Api Handler function not found`);
                return res.status(500).json({ error: `Api Handler function not found` });
            }
        } else {
            console_error(-1, this._Entity.className(), `executeApiHandlers - Error: Wrong Custom Api route`);
            return res.status(405).json({ error: `Wrong Custom Api route` });
        }
    }
    // #endregion custom api handlers
    // #region restrict api handlers
    public static async restricCreate(user: User | undefined) {
        //todo: tengo que resolver como va a funcionar el sync
        //en principio es un backend que se ejecuta sin usuario ni session
        // tal vez podria crear una session para el backedn
        return;
    }

    public async restricUpdate(user: User | undefined) {
        //todo
        return;
    }

    public async restricDelete(user: User | undefined) {
        //todo
        return;
    }

    // #endregion restrict api handlers
    // #region api handlers
    public static async getByAddressApiHandler<T extends AddressToFollowEntity>(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            //-------------------------
            console_log(1, this._Entity.className(), `getByAddressApiHandler - GET - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            //-------------------------
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    address: yup.string().required(),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `getByAddressApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //--------------------------------------
                const { address } = validatedQuery;
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const addressesToFollow = await this._BackEndApplied.getByAddress<T>(address, undefined, restricFilter);
                //-------------------------
                console_log(-1, this._Entity.className(), `getByAddressApiHandler - GET - OK`);
                //-------------------------
                return res.status(200).json(addressesToFollow.map((addressToFollow) => addressToFollow.toPlainObject()));
            } catch (error) {
                console_error(-1, this._Entity.className(), `getByAddressApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}: ${error}` });
            }
        } else if (req.method === 'POST') {
            //-------------------------
            console_log(1, this._Entity.className(), `getByAddressApiHandler - POST - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            console_log(1, this._Entity.className(), `body: ${showData(req.body)}`);
            //-------------------------
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    address: yup.string().required(),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `getByAddressApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //--------------------------------------
                const { address } = validatedQuery;
                //-------------------------
                const sanitizedBody = sanitizeForDatabase(req.body);
                //-------------------------
                const schemaBody = yup.object().shape(yupValidateOptionsGet);
                //-------------------------
                let validatedBody;
                try {
                    validatedBody = await schemaBody.validate(sanitizedBody);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `getByAddressApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const optionsGet: OptionsGet = { ...validatedBody };
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const addressesToFollow = await this._BackEndApplied.getByAddress<T>(address, optionsGet, restricFilter);
                //-------------------------
                console_log(-1, this._Entity.className(), `getByAddressApiHandler - POST - OK`);
                //-------------------------
                return res.status(200).json(addressesToFollow.map((addressToFollow) => addressToFollow.toPlainObject()));
            } catch (error) {
                console_error(-1, this._Entity.className(), `getByAddressApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while fetching the ${this._Entity.className()}: ${error}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `getByAddressApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async syncAllApiHandler<T extends AddressToFollowEntity>(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'POST') {
            console_log(1, this._Entity.className(), `syncAllApiHandler - POST - Init`);
            console_log(0, this._Entity.className(), `body: ${showData(req.body)}`);
            try {
                //--------------------------------------
                const schemaBody = yup.object().shape({
                    event: yup.string().label('Event'),
                    force: yup.boolean().label('Force Sync'),
                    tryCountAgain: yup.boolean().label('Try Again'),
                });
                const validatedBody = await schemaBody.validate(req.body);
                //--------------------------------------
                const { event, force, tryCountAgain }: { event?: string; force?: boolean; tryCountAgain?: boolean } = validatedBody;
                //--------------------------------------
                if (isEmulator) {
                    // solo en emulator. Me aseguro de setear el emulador al tiempo real del server. Va a saltear los slots necesarios.
                    // const TimeBackEnd = (await import('../../Time/backEnd.js')).TimeBackEnd;
                    // await TimeBackEnd.syncBlockChainWithServerTime()
                }
                //--------------------------------------
                const LucidToolsBackEnd = (await import('../lib/Lucid/LucidTools.BackEnd.js')).LucidToolsBackEnd;
                //--------------------------------------
                var { lucid } = await LucidToolsBackEnd.prepareLucidBackEndForTx(undefined);
                //--------------------------------------
                console_log(0, this._Entity.className(), `syncAllApiHandler - event: ${showData(event)}`);
                //--------------------------------------
                const addressesToFollow: T[] = await this._BackEndApplied.getAll_<T>();
                //--------------------------------------
                for (let addressToFollow of addressesToFollow) {
                    //--------------------------------------
                    let datumType = addressToFollow.datumType;
                    // const EntityClass = this._SmartDBEntities[datumType];
                    const EntityClass = RegistryManager.getFromSmartDBEntitiesRegistry(datumType);
                    if (EntityClass !== undefined) {
                        if (isEmulator === true && globalEmulator.emulatorDB === undefined) {
                            throw `globalEmulator emulatorDB current not found`;
                        }
                        await BaseSmartDBBackEndMethods.syncWithAddress(EntityClass, lucid, globalEmulator.emulatorDB, addressToFollow, force, tryCountAgain);
                    }
                    //--------------------------------------
                }
                //--------------------------------------
                console_log(-1, this._Entity.className(), `syncAllApiHandler - POST - OK`);
                //--------------------------------------
                return res.status(200).json({ message: `${this._Entity.className()} successfully synchronized` });
            } catch (error) {
                console_error(-1, this._Entity.className(), `syncAllApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while synchronizing the ${this._Entity.className()}: ${error}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `syncAllApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    public static async cleanApiHandler<T extends AddressToFollowEntity>(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            console_log(1, this._Entity.className(), `cleanApiHandler - GET - Init`);
            try {
                if (isEmulator) {
                    // solo en emulator. Me aseguro de setear el emulador al tiempo real del server. Va a saltear los slots necesarios.
                    // const TimeBackEnd = (await import('../../Time/backEnd.js')).TimeBackEnd;
                    // await TimeBackEnd.syncBlockChainWithServerTime()
                }
                //--------------------------------------
                // // TODO: estoy usandod esde la libreria generica esto que usa entidades de example... deberia hacer este metodo en una clase de example directamente
                // const ProtocolBackEndApplied = (await import('../../example/backEnd.js')).ProtocolBackEndApplied;
                // const FundBackEndApplied = (await import('../../example/backEnd.js')).FundBackEndApplied;
                // //--------------------------------------
                // const protocols: ProtocolEntity[] = await ProtocolBackEndApplied.getAll_();
                // const funds: FundEntity[] = await FundBackEndApplied.getAll_();
                // //--------------------------------------
                // // Create list of used addresses for protocols
                // interface addressAndCS {
                //     address: string;
                //     CS: string;
                // }
                // const usedProtocolAddresses: addressAndCS[] = protocols.flatMap((protocol) => [
                //     { address: protocol.getNet_Address(), CS: protocol.pdpProtocolPolicyID_CS },
                //     { address: protocol.getNet_Script_Validator_Address(), CS: protocol.pdpScriptPolicyID_CS },
                //     { address: protocol.getNet_SellOffer_Validator_Address(), CS: protocol.pdpSellOfferPolicyID_CS },
                //     { address: protocol.getNet_Delegation_Validator_Address(), CS: protocol.pdpDelegationPolicyID_CS },
                // ]);
                // // Create list of used addresses for funds
                // const usedFundAddresses: addressAndCS[] = funds.flatMap((fund) => [
                //     { address: fund.getNet_Address(), CS: fund.fdpFundPolicy_CS },
                //     { address: fund.getNet_FundHolding_Validator_Address(), CS: fund.fdpFundHoldingPolicyID_CS },
                // ]);

                // const usedInvestUnitAddresses: addressAndCS[] = protocols.flatMap((protocol) => {
                //     const address = protocol.getNet_Address();
                //     const usedFundAddresses: addressAndCS[] = funds.flatMap((fund) => {
                //         return { address, CS: fund.fdpFundPolicy_CS };
                //     });
                //     return usedFundAddresses;
                // });

                // // Combine all used addresses
                // const allUsedAddresses = [...usedProtocolAddresses, ...usedFundAddresses, ...usedInvestUnitAddresses];
                // //--------------------------------------
                // const addressesToFollow: T[] = await this._BackEndApplied.getAll_<T>();
                // //--------------------------------------
                // for (let addressToFollow of addressesToFollow) {
                //     //if addressToFollow.address is not in used addresses with same CS, we can delete it
                //     if (!allUsedAddresses.some((usedAddress) => usedAddress.address === addressToFollow.address && usedAddress.CS === addressToFollow.currencySymbol)) {
                //         console_log(0, this._Entity.className(), `cleanApiHandler - Deleting: ${addressToFollow.address}`);
                //         this._BackEndApplied.delete(addressToFollow);
                //     }
                // }
                //--------------------------------------
                console_log(-1, this._Entity.className(), `cleanApiHandler - GET - OK`);
                //--------------------------------------
                return res.status(200).json({ message: `${this._Entity.className()} successfully cleaned` });
            } catch (error) {
                console_error(-1, this._Entity.className(), `cleanApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while cleaning the ${this._Entity.className()}: ${error}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `cleanApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }
}
