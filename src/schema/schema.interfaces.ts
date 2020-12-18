export interface SchemaDefinition {
  [path: string]: SchemaType;
}

export type SchemaType =
  | any
  | Array<SchemaType>
  | SchemaTypeObject
  | SchemaDefinition;

export interface SchemaTypeObject {
  type: String | Boolean | Number | Date | Array<SchemaType> | SchemaDefinition;
  index?: boolean;
  required?: boolean;
  ref?: string;
  default?: any;
}
