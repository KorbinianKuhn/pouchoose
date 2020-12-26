import { AnySchema } from './any.schema';
import { ValidationError } from './validation.error';
import { ValidationResult } from './validation.interfaces';

export class StringSchema extends AnySchema {
  public _regex: RegExp;

  constructor() {
    super();
  }

  regex(pattern: string | RegExp): this {
    this._regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
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

    // String validation
    if (result !== undefined) {
      if (!(typeof result === 'string' || result instanceof String)) {
        return {
          error: new ValidationError('Value is not a string', result),
          value: result,
        };
      }

      if (this._regex && !result.match(this._regex)) {
        return {
          error: new ValidationError('Value does not match pattern', result),
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
