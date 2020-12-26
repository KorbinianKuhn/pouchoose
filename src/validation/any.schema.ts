import { ValidationError } from './validation.error';
import { ValidationResult } from './validation.interfaces';

export class AnySchema {
  public _required = false;
  public _default: any;
  public _index = false;
  public _ref: string;
  public _allow: any[];
  public _only = false;
  public _func: (value: any) => void | any = (value: any) => value;

  required(value: boolean): this {
    this._required;
    return this;
  }

  default(value: any): this {
    this._default = value;
    return this;
  }

  index(value: boolean): this {
    this._index = value;
    return this;
  }

  ref(name: string): this {
    this._ref = name;
    return this;
  }

  allow(...values: any[]): this {
    this._allow = values;
    return this;
  }

  only(): this {
    this._only = true;
    return this;
  }

  custom(func: (value: any) => void | any): this {
    this._func = (value: any) => {
      try {
        const res = func(value);
        return res === undefined ? value : res;
      } catch (err) {
        return {
          error: new ValidationError(err.message, value),
          value,
        };
      }
    };
    return this;
  }

  validate(value: any): ValidationResult {
    if (value === undefined && this._default !== undefined) {
      value = this._default;
    }

    if (this._required && value === undefined) {
      return {
        error: new ValidationError('Value is undefined', value),
        value,
      };
    }

    return {
      error: null,
      value,
    };
  }
}
