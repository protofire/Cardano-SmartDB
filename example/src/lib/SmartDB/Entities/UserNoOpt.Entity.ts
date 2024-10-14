
import 'reflect-metadata';
import { BaseEntity, Convertible, asEntity } from 'smart-db';

@asEntity()
export class UserNoOptEntity extends BaseEntity {
    protected static _apiRoute: string = 'user-no-opt';
    protected static _className: string = 'UserNoOpt';

    // #region fields

    @Convertible()
    firstName!: string;

    @Convertible()
    lastName!: string;

    @Convertible()
    email!: string;

    @Convertible()
    password!: string;

    @Convertible()
    birthDate!: Date;

    @Convertible()
    createdAt!: Date;

    @Convertible()
    updatedAt!: Date;

    // #endregion fields

    // #region  db

    public static defaultFieldsWhenUndefined: Record<string, boolean> = {};

    public static alwaysFieldsForSelect: Record<string, boolean> = {
        ...BaseEntity.alwaysFieldsForSelect,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        birthDate: true,
        createdAt: true,
        updatedAt: true,
    };

    // #endregion  db
}

