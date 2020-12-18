import { Document } from './../document/document.class';
import { Query } from './query.class';

export class SingleQuery<T extends Document> extends Query<T> {
  async exec(): Promise<T> {
    const docs = await super._exec();
    return docs[0] || null;
  }
}
