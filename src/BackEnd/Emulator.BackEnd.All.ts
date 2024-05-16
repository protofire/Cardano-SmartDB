import { Assets, Emulator, PrivateKey, addAssets } from 'lucid-cardano';
import { NextApiResponse } from 'next';
import { getAddressFromPrivateKey, isFrontEndEnvironment, sanitizeForDatabase, showData, strToHex } from '../Commons/index.js';
import { BackEndApiHandlersFor, BackEndAppliedFor } from '../Commons/Decorators/Decorator.BackEndAppliedFor.js';
import yup from '../Commons/yupLocale.js';
import { EmulatorEntity } from '../Entities/Emulator.Entity.js';
import { NextApiRequestAuthenticated } from '../lib/Auth/backEnd.js';
import { BaseBackEndApiHandlers } from './Base/Base.BackEnd.Api.Handlers.js';
import { BaseBackEndApplied } from './Base/Base.BackEnd.Applied.js';
import { BaseBackEndMethods } from './Base/Base.BackEnd.Methods.js';
import { console_error, console_log } from '../Commons/BackEnd/globalLogs.js';

@BackEndAppliedFor(EmulatorEntity)
export class EmulatorBackEndApplied extends BaseBackEndApplied {
    protected static _Entity = EmulatorEntity;
    protected static _BackEndMethods = BaseBackEndMethods;

    // #region class methods

    public static async createInit(name: string = 'Init', current: boolean = false): Promise<EmulatorEntity> {
        //-------------------------
        if (isFrontEndEnvironment()) {
            throw `Can't run this method in the Browser`;
        }
        //----------------------------
        let emulatorDB = await EmulatorBackEndApplied.getOneByParams_<EmulatorEntity>({ name, current });
        //----------------------------
        if (emulatorDB !== undefined) {
            console_error(0, this._Entity.className(), `already exists`);
            return emulatorDB;
        }
        //----------------------------
        const privateKeys: PrivateKey[] = [];
        privateKeys.push(process.env.NEXT_PUBLIC_emulatorWalletPrivateKey1!);
        privateKeys.push(process.env.NEXT_PUBLIC_emulatorWalletPrivateKey2!);
        privateKeys.push(process.env.NEXT_PUBLIC_emulatorWalletPrivateKey3!);
        privateKeys.push(process.env.NEXT_PUBLIC_emulatorWalletPrivateKey4!);

        // privateKeys.push(process.env.NEXT_PUBLIC_emulatorWalletPrivateKey5!)
        // privateKeys.push(process.env.NEXT_PUBLIC_emulatorWalletPrivateKey6!)
        // privateKeys.push(process.env.NEXT_PUBLIC_emulatorWalletPrivateKey7!)
        // privateKeys.push(process.env.NEXT_PUBLIC_emulatorWalletPrivateKey8!)
        // privateKeys.push(process.env.NEXT_PUBLIC_emulatorWalletPrivateKey9!)
        // privateKeys.push(process.env.NEXT_PUBLIC_emulatorWalletPrivateKey10!)

        const emulator_InitAssets: Assets = { lovelace: 1_000_000_000n };

        const accounts: any = [];

        for (const key of privateKeys) {
            const address = await getAddressFromPrivateKey(key);
            const account = { address, assets: { ...emulator_InitAssets } };
            accounts.push(account);
        }

        const emulator = new Emulator(accounts);
        emulatorDB = new EmulatorEntity({ name, emulator, privateKeys, current, zeroTime: emulator.time });
        const emulatorDB_ = await this.create(emulatorDB);

        return emulatorDB_;
        //----------------------------
    }
}

@BackEndApiHandlersFor(EmulatorEntity)
export class EmulatorBackEndApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = EmulatorEntity;
    protected static _BackEndApplied = EmulatorBackEndApplied;
    // protected static _BackEndMethods = this._BackEndApplied.getBack();

    // #region custom api handlers

    protected static _ApiHandlers: string[] = ['create-init'];

    protected static async executeApiHandlers(command: string, req: NextApiRequestAuthenticated, res: NextApiResponse) {
        //--------------------
        const { query } = req.query;
        //--------------------
        if (this._ApiHandlers.includes(command) && query !== undefined) {
            if (query[0] === 'create-init') {
                return await this.createInitApiHandler(req, res);
            }
            {
                console_error(-1, this._Entity.className(), `executeApiHandlers - Error: Api Handler function not found`);
                return res.status(500).json({ error: `Api Handler function not found` });
            }
        } else {
            console_error(-1, this._Entity.className(), `executeApiHandlers - Error: Wrong Custom Api route`);
            return res.status(405).json({ error: `Wrong Custom Api route` });
        }
    }

    // #endregion custom api handlers

    // #region api handlers

    public static async createInitApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            //-------------------------
            console_log(1, this._Entity.className(), `createInitApiHandler - GET - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            //-------------------------
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    name: yup.string(),
                    current: yup.boolean(),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `createInitApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //-------------------------
                const { name, current } = validatedQuery;
                //-------------------------
                const instance_ = await this._BackEndApplied.createInit(name, current);
                //-------------------------
                console_log(-1, this._Entity.className(), `createInitApiHandler - GET - OK`);
                //-------------------------
                return res.status(200).json(instance_.toPlainObject());
            } catch (error) {
                console_error(-1, this._Entity.className(), `createInitApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while adding the ${this._Entity.className()}: ${error}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `createInitApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    // #endregion api handlers
}
