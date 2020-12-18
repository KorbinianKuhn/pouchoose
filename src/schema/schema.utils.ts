import * as Joi from 'joi';
import { SchemaDefinition, SchemaTypeObject } from './schema.interfaces';

const extendSchema = (
  schema: Joi.Schema,
  definition: SchemaDefinition
): Joi.Schema => {
  let extended: Joi.Schema = schema;
  const meta: any = {
    index: false,
    ref: null,
  };
  for (const key of Object.keys(definition)) {
    switch (key) {
      case 'required':
        extended = extended.required();
        break;
      case 'index':
        meta.index = true;
        break;
      case 'default':
        extended = extended.default(definition[key]);
        break;
      case 'ref':
        meta.ref = definition[key];
        break;
    }
  }
  extended.meta(meta);

  return extended;
};

const getBooleanSchema = (definition: SchemaTypeObject): Joi.Schema => {
  return extendSchema(Joi.boolean(), definition);
};

const getNumberSchema = (definition: SchemaTypeObject): Joi.Schema => {
  return extendSchema(Joi.number(), definition);
};

const getStringSchema = (definition: SchemaTypeObject): Joi.Schema => {
  return extendSchema(Joi.string(), definition);
};

const getDateSchema = (definition: SchemaTypeObject): Joi.Schema => {
  return extendSchema(Joi.date(), definition);
};

const getArraySchema = (definition: SchemaDefinition): Joi.Schema => {
  return extendSchema(Joi.array(), definition);
};

const getObjectSchema = (definition: SchemaDefinition): Joi.Schema => {
  const keys: any = {};
  for (const key of Object.keys(definition)) {
    keys[key] = transformDefinitionToJoiSchema(definition[key]);
  }

  return extendSchema(Joi.object().keys(keys), definition);
};

const transformDefinitionToJoiSchema = (
  definition: SchemaDefinition
): Joi.Schema => {
  // Array
  if (Array.isArray(definition)) {
    return getArraySchema(definition);
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
    switch (definition.type.name) {
      case 'Boolean':
        return getBooleanSchema(definition as SchemaTypeObject);
      case 'Number':
        return getNumberSchema(definition as SchemaTypeObject);
      case 'String':
        return getStringSchema({ type: String });
      case 'Date':
        return getDateSchema({ type: Date });
      default:
        throw new Error(`Unsupported Schema type: ${definition.type.name}`);
    }
  }

  // Object
  return getObjectSchema(definition);
};

export const transformSchemaDefinitionToJoiSchema = (
  definition: SchemaDefinition
): Joi.ObjectSchema => {
  const keys: any = {
    _id: Joi.string(),
    _rev: Joi.string(),
    _deleted: Joi.boolean(),
  };
  for (const key of Object.keys(definition)) {
    keys[key] = transformDefinitionToJoiSchema(definition[key]);
  }

  return Joi.object(keys);
};
