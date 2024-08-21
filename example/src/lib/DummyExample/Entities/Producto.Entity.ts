import 'reflect-metadata';
import { BaseEntity, Convertible, asEntity } from 'smart-db';

@asEntity()
export class ProductoEntity extends BaseEntity {
    protected static _apiRoute: string = 'procutosrutaapi';
    protected static _className: string = 'Producto';

    // #region fields

    @Convertible()
    name!: string;

    @Convertible()
    description!: string;

    @Convertible()
    precio!: number;

    // #endregion fields

    // #region  db

    public static defaultFieldsWhenUndefined: Record<string, boolean> = {};

    public static alwaysFieldsForSelect: Record<string, boolean> = {
        ...super.alwaysFieldsForSelect,
        name: true,
        description: true,
        precio: true
    };

    // #endregion  db
}
