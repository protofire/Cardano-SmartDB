import { NextApiResponse } from 'next';
import { SiteSettingsEntity } from '../Entities/SiteSettings.Entity.js';
import { BaseBackEndApiHandlers } from './Base/Base.BackEnd.Api.Handlers.js';
import { SiteSettingsBackEndApplied } from './SiteSettings.BackEnd.Applied.js';
import { NextApiRequestAuthenticated } from '../lib/Auth/index.js';
import { BackEndApiHandlersFor, console_error, console_log, showData, tabs } from '../Commons/index.BackEnd.js';

@BackEndApiHandlersFor(SiteSettingsEntity)
export class SiteSettingsBackEndApiHandlers extends BaseBackEndApiHandlers {
    protected static _Entity = SiteSettingsEntity;
    protected static _BackEndApplied = SiteSettingsBackEndApplied;
    // protected static _BackEndMethods = this._BackEndApplied.getBack();

    // #region custom api handlers

    protected static _ApiHandlers: string[] = ['create-init', 'refresh-server'];

    protected static async executeApiHandlers(command: string, req: NextApiRequestAuthenticated, res: NextApiResponse) {
        //--------------------
        const { query } = req.query;
        //--------------------
        if (this._ApiHandlers.includes(command) && query !== undefined) {
            if (query[0] === 'create-init') {
                return await this.createInitApiHandler(req, res);
            } else if (query[0] === 'refresh-server') {
                return await this.refreshServerSiteSettingsApiHandler(req, res);
            }{
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
                const instance_ = await this._BackEndApplied.createInit();
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

    public static async refreshServerSiteSettingsApiHandler(req: NextApiRequestAuthenticated, res: NextApiResponse) {
        if (req.method === 'GET') {
            //-------------------------
            console_log(1, this._Entity.className(), `refreshSiteSettingsApiHandler - GET - Init`);
            console_log(0, this._Entity.className(), `query: ${showData(req.query)}`);
            //-------------------------
            try {
                const result = await this._BackEndApplied.refreshServerSiteSettings();
                //-------------------------
                console_log(-1, this._Entity.className(), `refreshSiteSettingsApiHandler - GET - OK`);
                //-------------------------
                return res.status(200).json({result});
            } catch (error) {
                console_error(-1, this._Entity.className(), `refreshSiteSettingsApiHandler - Error: ${error}`);
                return res.status(500).json({ error: `An error occurred while adding the ${this._Entity.className()}: ${error}` });
            }
        } else {
            console_error(-1, this._Entity.className(), `refreshSiteSettingsApiHandler - Error: Method not allowed`);
            return res.status(405).json({ error: `Method not allowed` });
        }
    }

    // // #endregion api handlers
}
