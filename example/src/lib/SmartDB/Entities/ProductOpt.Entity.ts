import 'reflect-metadata';
import { BaseEntity, Convertible, asEntity } from 'smart-db';

@asEntity()
export class ProductOptEntity extends BaseEntity {
    protected static _apiRoute: string = 'user-opt';
    protected static _className: string = 'ProductOpt';

    // #region fields

    @Convertible()
    firstName!: string;

    @Convertible()
    lastName!: string;

    @Convertible()
    email!: string;

    @Convertible() // Excluir por defecto
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
        birthDate: true,
        createdAt: true,
        updatedAt: true,
    };

    // Índices para mejorar el rendimiento de las búsquedas
    public static indexes = {
        emailIndex: { email: true },
        nameIndex: { firstName: true, lastName: true },
    };

    // #endregion  db
}

