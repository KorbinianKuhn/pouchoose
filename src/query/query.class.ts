import { Document } from '../document/document.class';
import { Model } from '../model/model.interfaces';
import { StringSchema } from '../validation/string.schema';
import { PouchooseError } from './../errors/pouchoose.error';
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

    let docs: T[];

    if (this.pipeline.length) {
      docs = decrypted.map((doc) => new Document(doc, this.model) as T);
      for (const step of this.pipeline) {
        const schema = this.model.schema.get(step.path);

        if (!(schema instanceof StringSchema) || !schema._ref) {
          throw new PouchooseError(
            'Schema path cannot be populated',
            'POPULATE_ERROR'
          );
        }

        const model = this.model.connection.models[schema._ref];
        if (!model) {
          throw new PouchooseError(
            'Unknown population model',
            'POPULATE_ERROR'
          );
        }

        const ids: string[] = [];
        for (const doc of docs) {
          const value = doc.get(step.path);
          if (Array.isArray(value)) {
            for (const id of value) {
              if (!ids.includes(id)) {
                ids.push(id);
              }
            }
          } else if (!ids.includes(value)) {
            ids.push(value);
          }
        }

        const subdocs: Document[] = await model.find({ _id: { $in: ids } });

        for (const doc of docs) {
          const value = doc.get(step.path);
          if (Array.isArray(value)) {
            const items = value.map(
              (item) => subdocs.find((o) => o._id === item) || null
            );
            doc.set(step.path, items);
          } else {
            console.log('1');
            const subdoc = subdocs.find((o) => o._id === value);
            doc.set(step.path, subdoc || null);
            console.log('2');
          }
        }
      }
    }

    if (docs) {
      return this._lean ? docs.map((doc) => doc.toObject()) : docs;
    } else {
      return this._lean
        ? (decrypted as any)
        : decrypted.map((doc) => new Document(doc, this.model) as T);
    }
  }
}
