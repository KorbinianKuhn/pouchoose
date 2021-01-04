import { ObjectSchema } from '../validation/object.schema';
import { StringSchema } from '../validation/string.schema';
import { Document } from './../document/document.class';
import {
  SchemaDefinition,
  SchemaMethods,
  SchemaOptions,
  SchemaStatics,
} from './schema.interfaces';
import { SchemaHookType } from './schema.types';
import { transformSchemaDefinitionToValidationSchema } from './schema.utils';
import { VirtualType } from './virtual.class';

export class Schema {
  private schema: ObjectSchema;
  private hooks: any[];

  public virtuals: VirtualType[] = [];
  public methods: SchemaMethods = {};
  public statics: SchemaStatics = {};

  constructor(
    definition: SchemaDefinition,
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

  /**
   * Creates a virtual type with the given name.
   */
  virtual(name: string): VirtualType {
    const virtual = new VirtualType(name);
    this.virtuals.push(virtual);
    return virtual;
  }

  /**
   * Adds an instance method to documents constructed from Models compiled from this schema.
   */
  method(name: string, fn: any): this {
    this.methods[name] = fn;
    return this;
  }

  /**
   * Adds static "class" methods to Models compiled from this schema.
   */
  static(name: string, fn: any): this {
    this.statics[name] = fn;
    return this;
  }

  pre(method: SchemaHookType, fn: (doc: Document) => Promise<void>): void {
    return;
  }

  post(method: SchemaHookType, fn: (doc: Document) => Promise<void>): void {
    return;
  }

  get(path?: any) {
    return this.schema.get(path);
  }
}
