import { AnySchema } from './any.schema';
import { ValidationResult } from './validation.interfaces';

export class BooleanSchema extends AnySchema {
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

    // Boolean validation
    if (result !== undefined) {
      // TODO
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
