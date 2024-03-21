import 'reflect-metadata';
import { asEntity } from '../Commons';
import { PriceEntity } from './Price.Entity';

@asEntity()
export class PriceHistoricEntity extends PriceEntity {
    protected static _apiRoute: string = 'prices-historic';
    protected static _className: string = 'Oracle Price Historic';

    // #region fields

    // #endregion fields
}
