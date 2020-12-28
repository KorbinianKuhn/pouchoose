import { AnySchema } from '../validation/any.schema';
import { ArraySchema } from '../validation/array.schema';
import { BooleanSchema } from '../validation/boolean.schema';
import { DateSchema } from '../validation/date.schema';
import { NumberSchema } from '../validation/number.schema';
import { ObjectSchema } from '../validation/object.schema';
import { StringSchema } from '../validation/string.schema';
import {
  SchemaDefinition,
  SchemaOptions,
  SchemaTypeObject,
} from './schema.interfaces';

const extendSchema = (
  schema: AnySchema,
  definition: SchemaDefinition
): AnySchema => {
  for (const key of Object.keys(definition)) {
    const value = definition[key];
    switch (key) {
      case 'required':
        schema.required(value);
        break;
      case 'index':
        schema.index(value);
        break;
      case 'default':
        schema.default(value);
        break;
      case 'ref':
        schema.ref(value);
        break;
      case 'validate':
        schema.custom(value);
        break;
    }
  }

  return schema;
};

const getBooleanSchema = (definition: SchemaTypeObject): BooleanSchema => {
  return extendSchema(new BooleanSchema(), definition);
};

const getNumberSchema = (definition: SchemaTypeObject): NumberSchema => {
  return extendSchema(new NumberSchema(), definition) as NumberSchema;
};

const getStringSchema = (definition: SchemaTypeObject): StringSchema => {
  return extendSchema(new StringSchema(), definition) as StringSchema;
};

const getDateSchema = (definition: SchemaTypeObject): DateSchema => {
  return extendSchema(new DateSchema(), definition);
};

const getArraySchema = (definition: SchemaDefinition): ArraySchema => {
  const schemas = definition.type as Array<SchemaDefinition>;
  const items: AnySchema[] =
    schemas.length === 0
      ? [new AnySchema()]
      : schemas.map((d) => transformDefinitionToValidationSchema(d));

  return extendSchema(new ArraySchema(items), definition) as ArraySchema;
};

const getObjectSchema = (definition: SchemaDefinition): ObjectSchema => {
  const keys: any = {};
  for (const key of Object.keys(definition)) {
    keys[key] = transformDefinitionToValidationSchema(definition[key]);
  }

  return extendSchema(new ObjectSchema(keys), definition) as ObjectSchema;
};

const transformDefinitionToValidationSchema = (
  definition: SchemaDefinition
): AnySchema => {
  // Array
  if (Array.isArray(definition)) {
    return getArraySchema({ type: definition });
  }

  // Primitive
  if (typeof definition !== 'object') {
    const name = (definition as any).name;
    switch (name) {
      case 'Boolean':
        return getBooleanSchema({ type: Boolean });
      case 'Number':
        return getNumberSchema({ type: Number });
      case 'String':
        return getStringSchema({ type: String });
      case 'Date':
        return getDateSchema({ type: Date });
      default:
        throw new Error(`Unsupported Schema type: ${name}`);
    }
  }

  // Definition
  if (Object.keys(definition).includes('type')) {
    if (Array.isArray(definition.type)) {
      return getArraySchema(definition);
    }
    switch (definition.type.name) {
      case 'Boolean':
        return getBooleanSchema(definition as SchemaTypeObject);
      case 'Number':
        return getNumberSchema(definition as SchemaTypeObject);
      case 'String':
        return getStringSchema(definition as SchemaTypeObject);
      case 'Date':
        return getDateSchema(definition as SchemaTypeObject);
      default:
        throw new Error(`Unsupported Schema type: ${definition.type.name}`);
    }
  }

  // Object
  return getObjectSchema(definition);
};

export const transformSchemaDefinitionToValidationSchema = (
  definition: SchemaDefinition,
  options: SchemaOptions
): ObjectSchema => {
  const keys: any = {
    _id: new StringSchema().required(false),
    _rev: new StringSchema().required(false),
    _deleted: new BooleanSchema().required(false),
  };

  if (options.timestamps) {
    keys.createdAt = new DateSchema().required(false);
    keys.modifiedAt = new DateSchema().required(false);
  }

  for (const key of Object.keys(definition)) {
    keys[key] = transformDefinitionToValidationSchema(definition[key]);
  }

  return new ObjectSchema(keys);
};
