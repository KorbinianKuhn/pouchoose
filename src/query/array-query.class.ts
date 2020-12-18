import { Document } from './../document/document.class';
import { Query } from './query.class';

export class ArrayQuery<T extends Document> extends Query<T> {
  sort(args: Array<string | { [propName: string]: 'asc' | 'desc' }>): this {
    this.query.request.sort = args;
    return this;
  }

  limit(value: number): this {
    this.query.request.limit = value;
    return this;
  }

  async exec(): Promise<T[]> {
    const docs = await super._exec();
    return docs;
  }
}
