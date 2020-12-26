import { isPlainObject } from '../utils/is-plain-object';
import { AnySchema } from './any.schema';
import { ValidationError } from './validation.error';
import { ValidationResult } from './validation.interfaces';

export class ObjectSchema extends AnySchema {
  constructor(private keys: { [key: string]: AnySchema }) {
    super();
  }

  append(keys: { [key: string]: AnySchema }): this {
    for (const key of Object.keys(keys)) {
      this.keys[key] = keys[key];
    }
    return this;
  }

  validate(value: any): ValidationResult {
    let result = value;

    // Default validation
    const res = super.validate(result);
    if (res.error) {
      return res;
    } else if (res.value !== undefined) {
      result = res.value;
    }

    // Object validation
    if (result !== undefined) {
      if (!isPlainObject(result)) {
        return {
          error: new ValidationError('Is not an object', result),
          value: result,
        };
      }

      for (const key of Object.keys(result)) {
        const schema = this.keys[key];
        if (!schema) {
          return {
            error: new ValidationError(`Unknown key ${key}`, result),
            value: result,
          };
        }
        const res2 = schema.validate(result[key]);
        if (res2.error) {
          return res2;
        } else if (res2.value !== undefined) {
          result[key] = res2.value;
        }
      }

      for (const key of Object.keys(this.keys)) {
        const res2 = this.keys[key].validate(result[key]);
        if (res2.error) {
          return res2;
        } else if (res2.value !== undefined) {
          result[key] = res2.value;
        }
      }
    }

    // Custom function
    const res2 = this._func(result);
    if (res2 !== undefined) {
      result = res2;
    }

    return {
      error: null,
      value: result,
    };
  }
}
