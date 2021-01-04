import { Subject } from 'rxjs';
import { Connection } from '../connection/connection.class';
import { Document } from '../document/document.class';
import { DocumentStream, LeanDocument } from '../document/document.interfaces';
import { ArrayQuery } from '../query/array-query.class';
import { FilterQuery, UpdateQuery } from '../query/query.interfaces';
import { SingleQuery } from '../query/single-query.class';
import { Schema } from '../schema/schema.class';

export interface Model<T extends Document> {
  new (doc?: Partial<LeanDocument<T>>): T;
  watch(): Subject<DocumentStream<T>>;
  create(doc?: Partial<LeanDocument<T>>): Promise<T>;
  insertMany(docs: Partial<LeanDocument<T>>[]): Promise<T[]>;
  count(conditions?: FilterQuery): Promise<number>;
  exists(conditions: FilterQuery): Promise<boolean>;
  find(conditions?: FilterQuery): ArrayQuery<T>;
  findOne(conditions?: FilterQuery): SingleQuery<T>;
  findOneAndDelete(conditions?: FilterQuery): Promise<T>;
  findOneAndUpdate(conditions: FilterQuery, update: UpdateQuery<T>): Promise<T>;
  findById(id: string): SingleQuery<T>;
  findAndUpdate(conditions: FilterQuery, update: UpdateQuery<T>): Promise<T[]>;
  findByIdAndUpdate(id: string, update: UpdateQuery<T>): Promise<T>;
  findAndDelete(conditions?: FilterQuery): Promise<T[]>;
  findByIdAndDelete(id: string): Promise<T>;
  modelName: string;
  schema: Schema;
  connection: Connection;
}
export interface ModelOptions {
  connection?: Connection;
}
