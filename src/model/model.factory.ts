import { Document } from '../document/document.class';
import { Schema } from '../schema/schema.class';
import { Model } from './model.class';

export const model = <T extends Document = any>(
  name: string,
  schema: Schema
): Model<T> => {
  return new Model<T>(name, schema);
};
