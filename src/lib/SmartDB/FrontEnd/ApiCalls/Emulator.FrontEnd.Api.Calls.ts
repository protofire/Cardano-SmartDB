import { createQueryURLString } from '../../Commons';
import { EmulatorEntity } from '../../Entities/Emulator.Entity';
import { BaseFrontEndApiCalls } from './Base/Base.FrontEnd.Api.Calls';

export class EmulatorDBFrontEndApiCalls extends BaseFrontEndApiCalls {
    protected static _Entity = EmulatorEntity;

    // #region api

    public static async createInitEmulatorApi(name: string = 'Init', current: boolean = false): Promise<EmulatorEntity> {
        try {
            //------------------
            const queryString = createQueryURLString({ name, current });
            //------------------
            const response = await fetch(`${process.env.NEXT_PUBLIC_REACT_SERVER_API_URL}/${this._Entity.apiRoute()}/create-init${queryString}`);
            //-------------------------
            if (response.status === 200) {
                const data = await response.json();
                console.log(`[${this._Entity.className()}] - createInitEmulatorApi - response OK`);
                const instance_ = this._Entity.fromPlainObject<EmulatorEntity>(data);
                console.log(`[${this._Entity.className()}] - createInitEmulatorApi - Instance: ${instance_.show()}`);
                return instance_;
            } else {
                const errorData = await response.json();
                //throw `Received status code ${response.status} with message: ${errorData.error.message ? errorData.error.message : errorData.error}`;
                throw `${errorData.error.message ? errorData.error.message : errorData.error}`;
            }
            //-------------------------
        } catch (error) {
            console.log(`[${this._Entity.className()}] - createInitEmulatorApi - Error: ${error}`);
            throw `${error}`;
        }
    }

    // #endregion api
}
