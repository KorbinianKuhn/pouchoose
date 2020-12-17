import { QueryOperation } from './query.enums';

export interface QueryConditions {
  type: QueryOperation;
  conditions: FilterQuery;
}

export interface FilterQuery {}

export interface UpdateQuery<T> {
  $set?: Partial<T>;
}
