import { ValidationError } from '../errors/validation.error';
import { AnySchema } from './any.schema';
import { ValidationResult } from './validation.interfaces';

export class ArraySchema extends AnySchema {
  constructor(private items: AnySchema[]) {
    super();
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

    // Array validation
    if (result !== undefined) {
      if (!Array.isArray(result)) {
        return {
          error: new ValidationError('Is not an array', result),
          value: result,
        };
      }

      const items: any[] = [];
      const errors: any[] = [];
      for (const item of result) {
        let error = false;
        let result2: any;
        for (const schema of this.items) {
          const res2 = schema.validate(item);
          if (res2.error) {
            error = true;
          } else if (res2.value !== undefined) {
            result2 = res2.value;
            break;
          } else {
            break;
          }
        }
        if (error) {
          errors.push(item);
        } else if (result2 !== undefined) {
          items.push(result2);
        } else {
          items.push(item);
        }
      }

      if (errors.length > 0) {
        return {
          error: new ValidationError('Invalid array values', errors),
          value: items,
        };
      } else {
        return {
          error: null,
          value: items,
        };
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
