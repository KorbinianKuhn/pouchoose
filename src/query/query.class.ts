import { Connection } from '../connection/connection.class';

export class Query<T = any> {
  private pipeline: any[] = [];

  constructor(
    private query: PouchDB.Find.FindRequest<T>,
    private connection: Connection
  ) {}

  sort(args: Array<string | { [propName: string]: 'asc' | 'desc' }>): this {
    this.query.sort = args;
    return this;
  }

  lean(): this {
    return this;
  }

  populate(): this {
    return this;
  }

  async exec(): Promise<T[]> {
    const res = await this.connection.db.find(this.query);

    for (const step of this.pipeline) {
      // TODO: execute pipeline steps
    }

    return res.docs as any[];
  }
}
