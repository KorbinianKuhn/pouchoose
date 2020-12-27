import { Document } from './../document/document.class';
import { Query } from './query.class';

export class SingleQuery<T extends Document> extends Query<T> {
  async exec(): Promise<T> {
    const docs = await super._exec();
    return docs[0] || null;
  }

  then(
    resolve: (value: T) => T | PromiseLike<T>,
    reject: (reason: any) => void | PromiseLike<void>
  ): Promise<void | T> {
    return this.exec().then(resolve, reject);
  }

  catch(reject: (reason: any) => PromiseLike<never>): Promise<T> {
    return this.exec().then(null, reject);
  }
}
