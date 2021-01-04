export interface SchemaDefinition {
  [path: string]: SchemaType;
}

export interface SchemaOptions {
  timestamps?: boolean;
}

export type SchemaType =
  | any
  | Array<SchemaType>
  | SchemaTypeObject
  | SchemaDefinition;

export interface SchemaTypeObject {
  type: string | boolean | number | Date | Array<SchemaType> | SchemaDefinition;
  index?: boolean;
  required?: boolean;
  ref?: string;
  default?: any;
  validate?: (value: any) => void | any;
}

export interface SchemaMethods {
  [key: string]: any;
}

export interface SchemaStatics {
  [key: string]: any;
}
