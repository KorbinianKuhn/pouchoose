import { ValidationError } from '../errors/validation.error';
import { AnySchema } from './any.schema';
import { ValidationResult } from './validation.interfaces';

export class NumberSchema extends AnySchema {
  public min: number;
  public max: number;
  public integer = false;

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

    // Number validation
    if (result !== undefined) {
      if (Number.isNaN(result)) {
        return {
          error: new ValidationError('Is not a number', result),
          value: result,
        };
      }

      if (this.integer && Number.isInteger(result)) {
        return {
          error: new ValidationError('Number is not an integer', result),
          value: result,
        };
      }

      // TODO min, max
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
