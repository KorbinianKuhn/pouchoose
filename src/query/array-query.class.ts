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
    return super._exec();
  }

  then(
    resolve: (value: T[]) => T[] | PromiseLike<T[]>,
    reject: (reason: any) => void | PromiseLike<void>
  ): Promise<void | T[]> {
    return this.exec().then(resolve, reject);
  }

  catch(reject: (reason: any) => PromiseLike<never>): Promise<T[]> {
    return this.exec().then(null, reject);
  }
}
