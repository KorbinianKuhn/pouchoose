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

export interface SchemaOptions {}

export class SafeSchema {
  public default: any = null;
  public required: boolean;
  public unique: boolean;
  public index: boolean;

  constructor(definition?: SchemaDefinition) {
    if (definition) {
      Object.keys(definition)
        .filter((key) =>
          ['default', 'required', 'unique', 'index'].includes(key)
        )
        .map((key) => (this[key] = definition[key]));
    }
  }

  get(value: any): any {
    return value ?? this.default;
  }

  transform(doc: any): any {
    return this.get(doc);
  }
}

export class BooleanSchema extends SafeSchema {
  constructor(definition?: SchemaDefinition) {
    super(definition);
  }
}

export class NumberSchema extends SafeSchema {
  constructor(definition?: SchemaDefinition) {
    super(definition);
  }
}

export class StringSchema extends SafeSchema {
  constructor(definition?: SchemaDefinition) {
    super(definition);
  }
}

export class DateSchema extends SafeSchema {
  constructor(definition?: SchemaDefinition) {
    super(definition);
  }
}

export class ArraySchema extends SafeSchema {
  constructor(definition?: SchemaDefinition) {
    super(definition);
  }

  get(doc: any) {
    if (!Array.isArray(doc)) {
      doc = [];
    }
    return doc;
  }
}

export class ObjectSchema extends SafeSchema {
  constructor(
    public paths: { [key: string]: SafeSchema },
    definition?: SchemaDefinition
  ) {
    super(definition);
  }

  get(doc: any) {
    if (doc === null) {
      doc = {};
    }
    for (const key in this.paths) {
      doc[key] = this.paths[key].get(doc[key]);
    }
    return doc;
  }
}

export class Schema<T = any> {
  private internal: SafeSchema;

  constructor(definition: SchemaDefinition, options?: SchemaOptions) {
    this.internal = this.getSafeSchema(definition, options);
  }

  private getSafeSchema(
    definition: SchemaDefinition,
    options?: SchemaOptions
  ): SafeSchema {
    // Array
    if (Array.isArray(definition)) {
      console.log('array');
      return;
    }

    // Primitive
    if (typeof definition !== 'object') {
      switch ((definition as any).name) {
        case 'Boolean':
          return new BooleanSchema();
        case 'Number':
          return new NumberSchema();
        case 'String':
          return new StringSchema();
        case 'Date':
          return new DateSchema();
        default:
          throw new Error();
      }
    }

    // Definition
    if ('type' in definition) {
      switch (definition.type.name) {
        case 'Boolean':
          return new BooleanSchema(definition);
        case 'Number':
          return new NumberSchema(definition);
        case 'String':
          return new StringSchema(definition);
        case 'Date':
          return new DateSchema(definition);
        default:
          throw new Error();
      }
    }

    // Nested
    const paths = {};
    for (const key in definition) {
      paths[key] = this.getSafeSchema(definition[key]);
    }
    return new ObjectSchema(paths);
  }

  transform(doc: any): Document {
    return this.internal.get(doc);
  }

  pre(event: 'save', cb: Function) {}
}
