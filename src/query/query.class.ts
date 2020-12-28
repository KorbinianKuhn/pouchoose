import { Connection } from '../connection/connection.class';
import { Document } from '../document/document.class';
import { Schema } from '../schema/schema.class';
import { QueryConditions } from './query.interfaces';

export abstract class Query<T extends Document> {
  public pipeline: any[] = [];

  constructor(
    public query: QueryConditions,
    public connection: Connection,
    public schema: Schema
  ) {}

  skip(value: number): this {
    this.query.request.skip = value;
    return this;
  }

  lean(): this {
    return this;
  }

  populate(): this {
    return this;
  }

  protected async _exec(): Promise<T[]> {
    const res = await this.connection.db.find(this.query.request);

    const decrypted = this.connection.decrypt
      ? await this.connection.decrypt(res.docs)
      : res.docs;

    // for (const step of this.pipeline) {
    //   // TODO: execute pipeline steps
    // }

    return decrypted.map(
      (doc) => new Document(this.schema.validate(doc), null) as T
    );
  }
}
