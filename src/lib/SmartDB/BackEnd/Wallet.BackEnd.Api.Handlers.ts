import { NextApiResponse } from 'next';
import { NextApiRequestAuthenticated } from '@/src/lib/SmartDB/lib/Auth/index';
import { BaseBackEndApiHandlers } from './Base/Base.BackEnd.Api.Handlers';
import { console_error, console_log, tabs } from '../Commons/BackEnd/globalLogs';
import { WalletBackEndApplied } from './Wallet.BackEnd.Applied';
import { WalletEntity } from '../Entities/Wallet.Entity';
import { showData, sanitizeForDatabase } from '../Commons';
import yup from '../Commons/yupLocale';


export class WalletBackEndApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = WalletEntity;
    protected static _BackEndApplied = WalletBackEndApplied;
    // protected static _BackEndMethods = this._BackEndApplied.getBack();
   
    // #region custom api handlers
    protected static _ApiHandlers: string[] = ['is-core-team'];

    protected static async executeApiHandlers(command: string, req: NextApiRequestAuthenticated, res: NextApiResponse) {
        //--------------------
        const { query } = req.query;
        //--------------------
        if (this._ApiHandlers.includes(command) && query !== undefined) {
            if (query[0] === 'is-core-team') {
                if (query.length === 2) {
                    req.query = { pkh: query[1] };
                } else {
                    req.query = {};
                }
                return await this.isCoreTeamApiHandler(req, res);
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

    // #region api handlers

    public static async isCoreTeamApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            //-------------------------
            console_log(1, this._Entity.className(), `isCoreTeamApiHandler - GET - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            //-------------------------
            try {
                //-------------------------
                const sanitizedQuery = sanitizeForDatabase(req.query);
                //-------------------------
                const schemaQuery = yup.object().shape({
                    pkh: yup.string().required(),
                });
                //-------------------------
                let validatedQuery;
                try {
                    validatedQuery = await schemaQuery.validate(sanitizedQuery);
                } catch (error) {
                    console_error(-1, this._Entity.className(), `isCoreTeamApiHandler - Error: ${error}`);
                    return res.status(400).json({ error });
                }
                //--------------------------------------
                const { pkh } = validatedQuery;
                //-------------------------
                const user = req.user;
                let restricFilter = await this.restricFilter(user);
                //-------------------------
                const isCoreTeam = await this._BackEndApplied.isCoreTeam(pkh, restricFilter);
                //-------------------------
                console_log(-1, this._Entity.className(), `isCoreTeamApiHandler - GET - OK`);
                //-------------------------
                return res.status(200).json({ isCoreTeam });
            } catch (error) {
                console_error(-1, this._Entity.className(), `isCoreTeamApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while checking if the ${this._Entity.className()} exists: ${error}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `isCoreTeamApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    // #endregion api handlers


}
