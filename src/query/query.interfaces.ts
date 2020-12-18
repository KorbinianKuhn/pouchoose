import { QueryOperation } from './query.enums';

export interface QueryConditions {
  type: QueryOperation;
  request: PouchDB.Find.FindRequest<any>;
}

export interface FilterQuery extends PouchDB.Find.Selector {}

export interface UpdateQuery<T> {
  $set?: Partial<T> | { [key: string]: any };
}
