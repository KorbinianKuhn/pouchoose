import * as PouchDB from 'pouchdb';
import * as PouchDBFind from 'pouchdb-find';
import { Subject } from 'rxjs';
import { v4 } from 'uuid';
import { Model } from '../model/model.class';
import { Remote } from '../remote/remote.class';
import {
  DocumentChange,
  DocumentStream,
  GenericDoc,
} from './../document/document.interfaces';
import {
  DecryptionCallback,
  EncryptionCallback,
} from './connection.interfaces';

PouchDB.plugin(PouchDBFind);

export class Connection {
  private options: PouchDB.Configuration.DatabaseConfiguration;
  private dbChanges: PouchDB.Core.Changes<any>;
  private stream = new Subject<DocumentStream<any>>();
  private models: Model<any>[] = [];

  public name: string;
  public db: PouchDB.Database;
  public encrypt: EncryptionCallback;
  public decrypt: DecryptionCallback;

  public configure(
    name: string,
    options?: PouchDB.Configuration.DatabaseConfiguration
  ) {
    this.name = name;
    this.options = options;
  }

  public async disconnect(): Promise<void> {
    this.dbChanges.cancel();
    delete this.dbChanges;
    await this.db.close();
  }

  public async reconnect(): Promise<void> {
    // Create DB
    this.db = new PouchDB(this.name, this.options);

    // Listen for events
    this.dbChanges = this.db
      .changes({ live: true, since: 'now', include_docs: true })
      .on('change', (value: PouchDB.Core.ChangesResponseChange<any>) =>
        this.onPouchdbChange(value)
      )
      .on('error', (value: any) => console.error('error', value));
    // .on('complete', (value: PouchDB.Core.ChangesResponse<any>) => {});

    // Create indexes
    await this.ensureIndexes();
  }

  public remote(remote: PouchDB.Database): Remote {
    return new Remote(this, remote);
  }

  public id(): string {
    return v4();
  }

  public async getIndexes(): Promise<PouchDB.Find.Index[]> {
    const res = await this.db.getIndexes();

    return res.indexes.filter((o) => o.name !== '_all_docs');
  }

  public async isDbEmpty(): Promise<boolean> {
    const count = await this.countAllDocuments();
    return count === 0;
  }

  public async removeAllDocuments(): Promise<void> {
    this.dbChanges.cancel();
    delete this.dbChanges;
    await this.db.destroy();
    delete this.db;
    await this.reconnect();
  }

  public async countAllDocuments(): Promise<number> {
    const [info, indexes] = await Promise.all([
      this.db.info(),
      this.getIndexes(),
    ]);
    return info.doc_count - indexes.length;
  }

  public async getAllDocuments(): Promise<GenericDoc[]> {
    const docs = await this.db.allDocs({ include_docs: true });

    return docs.rows.map((row) => row.doc);
  }

  public registerModel(model: Model<any>): void {
    this.models.push(model);
    if (this.db) {
      // TODO: create indexes
    }
  }

  private async ensureIndexes(): Promise<void> {
    const dto: { name: string; fields: string[] }[] = [
      {
        name: '$type',
        fields: ['$type'],
      },
    ];

    for (const model of this.models) {
      for (const key of model.getIndexedKeys()) {
        const fields = ['$type', key];
        const name = fields.join('-');
        if (!dto.some((o) => o.name === name)) {
          dto.push({ name, fields });
        }
      }
    }

    await Promise.all(
      dto.map((o) =>
        this.db.createIndex({
          index: {
            name: o.name,
            fields: o.fields,
          },
        })
      )
    );
  }

  private onPouchdbChange(
    value: PouchDB.Core.ChangesResponseChange<any>
  ): void {
    const change: DocumentChange = value.deleted
      ? 'delete'
      : /^1-.*/.test(value.doc._rev)
      ? 'add'
      : 'update';

    // TODO: convert to Document?

    this.stream.next({
      change,
      doc: value.doc,
    });
  }

  public watch(): Subject<DocumentStream<any>> {
    return this.stream;
  }
}
