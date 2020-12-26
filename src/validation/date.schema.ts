import { AnySchema } from './any.schema';
import { ValidationError } from './validation.error';
import { ValidationResult } from './validation.interfaces';

export class DateSchema extends AnySchema {
  constructor() {
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

    // Date validation
    if (result !== undefined) {
      const date = result instanceof Date ? result : new Date(result);

      if (isNaN(date.getTime())) {
        return {
          error: new ValidationError('Invalid date', result),
          value: result,
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
