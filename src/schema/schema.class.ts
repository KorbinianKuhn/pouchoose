import { ObjectSchema } from '../validation/object.schema';
import { StringSchema } from '../validation/string.schema';
import { SchemaDefinition, SchemaOptions } from './schema.interfaces';
import { SchemaHookType } from './schema.types';
import { transformSchemaDefinitionToValidationSchema } from './schema.utils';

export class Schema {
  private schema: ObjectSchema;

  constructor(
    private definition: SchemaDefinition,
    public options: SchemaOptions = {}
  ) {
    this.schema = transformSchemaDefinitionToValidationSchema(
      definition,
      options
    );
  }

  getIndexedKeys(): string[] {
    const keys = this.schema.keys;
    return Object.keys(keys)
      .filter((s) => keys[s]._index)
      .map((s) => s);
  }

  setType(name: string): void {
    this.schema = this.schema.append({
      $type: new StringSchema().only().allow(name).default(name),
    });
  }

  validate(value: any): any {
    const res = this.schema.validate(value);
    if (res.error) {
      throw res.error;
    } else {
      return res.value;
    }
  }

  pre(method: SchemaHookType, fn: (doc: Document) => Promise<void>): void {
    return;
  }

  post(method: SchemaHookType, fn: (doc: Document) => Promise<void>): void {
    return;
  }
}
