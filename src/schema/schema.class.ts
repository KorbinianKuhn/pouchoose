import * as Joi from 'joi';
import { SchemaDefinition } from './schema.interfaces';
import { transformSchemaDefinitionToJoiSchema } from './schema.utils';

export class Schema {
  private schema: Joi.Schema;

  constructor(definition: SchemaDefinition) {
    this.schema = transformSchemaDefinitionToJoiSchema(definition);
  }

  setType(name: string) {
    this.schema = (this.schema as Joi.ObjectSchema).append({
      $type: Joi.string().only().allow(name).default(name),
    });
  }

  validate(value: any) {
    const res = this.schema.validate(value);
    if (res.error) {
      throw res.error;
    } else {
      return res.value;
    }
  }
}
