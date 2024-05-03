import { BaseSmartDBFrontEndApiCalls } from 'smart-db';
import { DummyEntity } from '../Entities/Dummy.Entity';

export class DummyApi extends BaseSmartDBFrontEndApiCalls {
    protected static _Entity = DummyEntity;

    // #region api

    // #endregion api
}
