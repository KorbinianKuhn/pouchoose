import { Connection } from '../connection/connection.class';
import { Document } from '../document/document.class';
import { Schema } from '../schema/schema.class';
import { QueryConditions } from './query.interfaces';

export abstract class Query<T extends Document> {
  public pipeline: any[] = [];

  private _lean: boolean = false;

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
    this._lean = true;
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

    const validated = decrypted.map((o) => this.schema.validate(o));

    return this._lean
      ? validated
      : validated.map((doc) => new Document(doc, null) as T);
  }
}
