import 'reflect-metadata';
import { BaseEntity, Convertible, asEntity } from 'smart-db';

@asEntity()
export class TestEntity extends BaseEntity {
    protected static _apiRoute: string = 'test';
    protected static _className: string = 'Test';

    // #region fields

    @Convertible({ required: true })
    name!: string;

    @Convertible({ required: false })
    description!: string;

    // #endregion fields

    // #region  db

    public static defaultFieldsWhenUndefined: Record<string, boolean> = {};

    public static alwaysFieldsForSelect: Record<string, boolean> = {
        ...BaseEntity.alwaysFieldsForSelect,
        name: true,
        description: true,
    };

    // #endregion  db
}
