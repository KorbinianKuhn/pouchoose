import { QueryOperation } from './query.enums';

export interface QueryConditions {
  type: QueryOperation;
  request: PouchDB.Find.FindRequest<any>;
}

export interface FilterQuery extends PouchDB.Find.Selector {}

export interface UpdateQuery<T> {
  $set?: SetOperator;
  $unset?: UnsetOperator;
  $pop?: PopOperator;
  $push?: PushOperator;
  $pull?: PullOperator;
  $pullAll?: PullAllOperator;
  $inc?: IncOperator;
  $dec?: DecOperator;
}

export interface SetOperator {
  [key: string]: any;
}

export interface UnsetOperator {
  [key: string]: 0 | 1;
}

export interface PopOperator {
  [key: string]: any[];
}
export interface PushOperator {
  [key: string]: any[];
}
export interface PullOperator {
  [key: string]: any[];
}
export interface PullAllOperator {
  [key: string]: any[];
}

export interface IncOperator {
  [key: string]: number;
}
export interface DecOperator {
  [key: string]: number;
}
