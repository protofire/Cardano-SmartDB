import fetchWrapper from '../../lib/FetchWrapper/FetchWrapper.FrontEnd.js';
import { SiteSettingsEntity } from '../../Entities/SiteSettings.Entity.js';
import { BaseFrontEndApiCalls } from './Base/Base.FrontEnd.Api.Calls.js';

export class SiteSettingsFrontEndApiCalls extends BaseFrontEndApiCalls {
    protected static _Entity = SiteSettingsEntity;

    // #region api

    public static async createInitSiteSettingsApi(name: string = 'Init'): Promise<SiteSettingsEntity> {
        try {
            // tambien se crea en AuthBackEnd
            //-------------------------
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/create-init`);
            //-------------------------
            if (response.status === 200) {
                const data = await response.json();
                console.log(`[${this._Entity.className()}] - createInitSiteSettingsApi - response OK`);
                const instance_ = this._Entity.fromPlainObject<SiteSettingsEntity>(data);
                console.log(`[${this._Entity.className()}] - createInitSiteSettingsApi - Instance: ${instance_.show()}`);
                return instance_;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
            //-------------------------
        } catch (error) {
            console.log(`[${this._Entity.className()}] - createInitSiteSettingsApi - Error: ${error}`);
            throw error;
        }
    }

    public static async refreshServerSiteSettingsApi(name: string = 'Init'): Promise<boolean> {
        try {
            // tambien se crea en AuthBackEnd
            //-------------------------
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/refresh-server`);
            //-------------------------
            if (response.status === 200) {
                const data = await response.json();
                console.log(`[${this._Entity.className()}] - refreshSiteSettingsApi - response OK`);
                return data.result;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
            //-------------------------
        } catch (error) {
            console.log(`[${this._Entity.className()}] - refreshSiteSettingsApi - Error: ${error}`);
            throw error;
        }
    }

    // #endregion api
}
