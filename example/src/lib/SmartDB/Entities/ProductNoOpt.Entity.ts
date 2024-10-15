import 'reflect-metadata';
import { BaseEntity, Convertible, asEntity } from 'smart-db';

@asEntity()
export class ProductNoOptEntity extends BaseEntity {
    protected static _apiRoute: string = 'product-no-opt';
    protected static _className: string = 'ProductNoOpt';

    // #region fields

    @Convertible()
    name!: string;

    @Convertible()
    description!: string;

    @Convertible()
    price!: number;

    @Convertible()
    stock!: number;

    @Convertible()
    category!: string;

    @Convertible()
    createdAt!: Date;

    @Convertible()
    updatedAt!: Date;

    // #endregion fields

    // #region  db

    public static defaultFieldsWhenUndefined: Record<string, boolean> = {};

    public static alwaysFieldsForSelect: Record<string, boolean> = {
        ...BaseEntity.alwaysFieldsForSelect,
        name: true,
        description: true,
        price: true,
        stock: true,
        category: true,
        createdAt: true,
        updatedAt: true,
    };

    // #endregion  db
}

