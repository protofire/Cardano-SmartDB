import 'reflect-metadata';

import { Convertible, BaseEntity, asEntity } from 'smart-db';

import {  } from 'lucid-cardano';

@asEntity()

export class ProductEntity extends BaseEntity {
    protected static _apiRoute: string = 'product';
    protected static _className: string = 'Product';

    // #region fields

    @Convertible()
    name?: string;
    @Convertible()
    description!: string;
    @Convertible()
    precio!: number;

    // #endregion fields

    // #region db

    public static defaultFieldsWhenUndefined: Record<string, boolean> = {};

    public static alwaysFieldsForSelect: Record<string, boolean> = {
        ...super.alwaysFieldsForSelect,
          name: true,
          description: true,
          precio: true,
    };

    // #endregion db
}
