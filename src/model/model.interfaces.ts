import { Subject } from 'rxjs';
import { Connection } from '../connection/connection.class';
import { Document } from '../document/document.class';
import { DocumentStream, LeanDocument } from '../document/document.interfaces';
import { ArrayQuery } from '../query/array-query.class';
import { FilterQuery, UpdateQuery } from '../query/query.interfaces';
import { SingleQuery } from '../query/single-query.class';
import { Schema } from '../schema/schema.class';

export interface Model<T extends Document> {
  /**
   * Provides the interface to a models db operations as well as it creates document instances.
   */
  new (doc?: Partial<LeanDocument<T>>): T;

  watch(): Subject<DocumentStream<T>>;

  /**
   * Shortcut for saving a document to the database. MyModel.create(doc)
   * does the same like new MyModel(doc).save().
   */
  create(doc?: Partial<LeanDocument<T>>): Promise<T>;

  /**
   * Shortcut for validating an array of documents and inserting them into
   * database if they're all valid. This function is faster than .create()
   * because it only executes one bulk operation, rather than one for each
   * document.
   */
  insertMany(docs: Partial<LeanDocument<T>>[]): Promise<T[]>;

  /** Counts number of matching documents in a database collection. */
  count(conditions?: FilterQuery): Promise<number>;

  /**
   * Returns true if at least one document exists in the database that matches
   * the given conditions, and false otherwise.
   */
  exists(conditions: FilterQuery): Promise<boolean>;

  /**
   * Finds documents matching the given conditions.
   */
  find(conditions?: FilterQuery): ArrayQuery<T>;

  /**
   * Finds one document matching the given conditions.
   */
  findOne(conditions?: FilterQuery): SingleQuery<T>;

  /**
   * Finds one document matching the given conditions, sets it as deleted and updates it.
   */
  findOneAndDelete(conditions?: FilterQuery): Promise<T>;

  /**
   * Finds one document matching the given conditions and updates it.
   */
  findOneAndUpdate(conditions: FilterQuery, update: UpdateQuery<T>): Promise<T>;

  /**
   * Finds a single document by its _id field. findById(id) is almost*
   * equivalent to findOne({ _id: id }).
   */
  findById(id: string): SingleQuery<T>;

  /**
   * Finds all documents matching given conditions and updates them.
   */
  findAndUpdate(conditions: FilterQuery, update: UpdateQuery<T>): Promise<T[]>;

  /**
   * Finds a document by its id and updates it.
   */
  findByIdAndUpdate(id: string, update: UpdateQuery<T>): Promise<T>;

  /**
   * Finds all documents matching given conditions, sets them as deleted and updates them.
   */
  findAndDelete(conditions?: FilterQuery): Promise<T[]>;

  /**
   * Finds a document by its id, sets it as deleted and updates it.
   */
  findByIdAndDelete(id: string): Promise<T>;

  modelName: string;
  schema: Schema;
  connection: Connection;
}
export interface ModelOptions {
  connection?: Connection;
}
