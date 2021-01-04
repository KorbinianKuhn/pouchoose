import { Document } from '../document/document.class';
import { PouchooseError } from '../errors/pouchoose.error';
import {
  DecOperator,
  IncOperator,
  PopOperator,
  PullAllOperator,
  PullOperator,
  PushOperator,
  SetOperator,
  UnsetOperator,
  UpdateQuery,
} from './../query/query.interfaces';

export const applyUpdateQueryToDocs = <T extends Document>(
  docs: T[],
  update: UpdateQuery<T>
): void => {
  for (const operator of Object.keys(update)) {
    switch (operator) {
      case '$set': {
        applySetOperator<T>(docs, update[operator]);
        break;
      }
      case '$unset': {
        applyUnsetOperator<T>(docs, update[operator]);
        break;
      }
      case '$pop': {
        applyPopOperator<T>(docs, update[operator]);
        break;
      }
      case '$push': {
        applyPushOperator<T>(docs, update[operator]);
        break;
      }
      case '$pull': {
        applyPullOperator<T>(docs, update[operator]);
        break;
      }
      case '$pullAll': {
        applyPullAllOperator<T>(docs, update[operator]);
        break;
      }
      case '$inc': {
        applyIncOperator<T>(docs, update[operator]);
        break;
      }
      case '$dec': {
        applyDecOperator<T>(docs, update[operator]);
        break;
      }
      default:
        throw new PouchooseError(
          `Unknown update operator: ${operator}`,
          'UNKNOWN_UPDATE_OPERATOR'
        );
    }
  }
};

const applySetOperator = <T extends Document>(
  docs: T[],
  dto: SetOperator
): void => {
  const paths = Object.keys(dto);
  for (const doc of docs) {
    for (const path of paths) {
      doc.set(path, dto[path]);
    }
  }
};

const applyUnsetOperator = <T extends Document>(
  docs: T[],
  dto: UnsetOperator
): void => {
  const paths = Object.keys(dto).filter((key) => dto[key] === 1);
  for (const doc of docs) {
    for (const path of paths) {
      doc.unset(path);
    }
  }
};

const applyPopOperator = <T extends Document>(
  docs: T[],
  dto: PopOperator
): void => {
  const paths = Object.keys(dto);
  for (const doc of docs) {
    for (const path of paths) {
      const array = doc.get(path) as any[];
      if (!Array.isArray(array)) {
        throw new Error('');
      }
      array.pop();
    }
  }
};

const applyPushOperator = <T extends Document>(
  docs: T[],
  dto: PushOperator
): void => {
  const paths = Object.keys(dto);
  for (const doc of docs) {
    for (const path of paths) {
      const elements = dto[path];
      const array = doc.get(path) as any[];
      if (!Array.isArray(array)) {
        throw new Error('');
      }
      array.push(...elements);
    }
  }
};

const applyPullOperator = <T extends Document>(
  docs: T[],
  dto: PullOperator
): void => {
  const paths = Object.keys(dto);
  for (const doc of docs) {
    for (const path of paths) {
      // TODO
    }
  }
};

const applyPullAllOperator = <T extends Document>(
  docs: T[],
  dto: PullAllOperator
): void => {
  const paths = Object.keys(dto);
  for (const doc of docs) {
    for (const path of paths) {
      // TODO
    }
  }
};

const applyIncOperator = <T extends Document>(
  docs: T[],
  dto: IncOperator
): void => {
  const paths = Object.keys(dto);
  for (const doc of docs) {
    for (const path of paths) {
      // TODO
    }
  }
};

const applyDecOperator = <T extends Document>(
  docs: T[],
  dto: DecOperator
): void => {
  const paths = Object.keys(dto);
  for (const doc of docs) {
    for (const path of paths) {
      // TODO
    }
  }
};
