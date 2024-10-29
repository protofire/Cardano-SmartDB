import 'reflect-metadata';
import { BaseEntity, Convertible, asEntity } from 'smart-db';

@asEntity()
export class ProductOptEntity extends BaseEntity {
  protected static _apiRoute: string = 'product-opt';
  protected static _className: string = 'ProductOpt';

  // #region fields

  @Convertible() // Índice en el nombre para mejorar las búsquedas
  name!: string;

  @Convertible()
  description!: string;

  @Convertible() // No seleccionar este campo en las consultas por defecto
  price!: number;

  @Convertible()
  stock!: number;

  @Convertible() // Índice en la categoría para mejorar las búsquedas
  category!: string;

  @Convertible()
  createdAt!: Date;

  @Convertible()
  updatedAt!: Date;

  @Convertible() // Soft delete, no se selecciona por defecto
  deletedAt?: Date;

  // #endregion fields

  // #region db

  // #endregion db
}
