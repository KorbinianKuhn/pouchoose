import { Document } from '../document/document.class';
import { SchemaDefinition } from '../schema/schema.interfaces';
import { Model } from './model.class';

export const model = <T extends Document<T>>(
  name: string,
  schema: SchemaDefinition
): Model<T> => {
  return new Model<T>(name, schema);
};
