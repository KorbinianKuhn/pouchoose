import { Document } from '../document/document.class';
import { Model } from '../model/model.interfaces';
import { QueryConditions, QueryPipelineItem } from './query.interfaces';

export abstract class Query<T extends Document> {
  public pipeline: QueryPipelineItem[] = [];

  private _lean = false;

  constructor(public query: QueryConditions, public model: Model<T>) {}

  skip(value: number): this {
    this.query.request.skip = value;
    return this;
  }

  lean(): this {
    this._lean = true;
    return this;
  }

  populate(path: string): this {
    this.pipeline.push({
      type: 'populate',
      path,
    });
    return this;
  }

  protected async _exec(): Promise<T[]> {
    const res = await this.model.connection.db.find(this.query.request);

    const decrypted = this.model.connection.decrypt
      ? await this.model.connection.decrypt(res.docs)
      : res.docs;

    for (const step of this.pipeline) {
      // TODO: populate
    }

    return this._lean
      ? (decrypted as any)
      : decrypted.map((doc) => new Document(doc, this.model) as T);
  }
}
