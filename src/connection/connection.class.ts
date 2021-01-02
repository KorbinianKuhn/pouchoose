import * as PouchDB from 'pouchdb';
import * as PouchDBFind from 'pouchdb-find';
import { Subject } from 'rxjs';
import { v4 } from 'uuid';
import { Model } from '../model/model.class';
import { SyncHandler } from '../sync-handler/sync-handler.class';
import {
  DocumentChange,
  GenericDoc,
  GenericDocumentStream,
} from './../document/document.interfaces';
import {
  DecryptionCallback,
  EncryptionCallback,
} from './connection.interfaces';

PouchDB.plugin(PouchDBFind);

export class Connection {
  private options: PouchDB.Configuration.DatabaseConfiguration;
  private dbChanges: PouchDB.Core.Changes<any>;
  private stream = new Subject<GenericDocumentStream>();
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
    await this.ensureIndexes(this.models);
  }

  public sync(db: PouchDB.Database): SyncHandler {
    return new SyncHandler(this, db);
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

  public async deleteAllDocuments(): Promise<void> {
    const docs = await this.getAllDocuments();
    await this.db.bulkDocs(
      docs.map((o) => {
        o._deleted = true;
        return o;
      })
    );
  }

  public async destroyDatabase(): Promise<void> {
    this.dbChanges.cancel();
    delete this.dbChanges;
    await this.db.destroy();
    delete this.db;
  }

  public registerModel(model: Model<any>): void {
    this.models.push(model);
    if (this.db) {
      this.ensureIndexes([model]);
    }
  }

  private async ensureIndexes(models: Model<any>[]): Promise<void> {
    const newIndexes: { name: string; fields: string[] }[] = [
      {
        name: '$type',
        fields: ['$type'],
      },
    ];

    for (const model of models) {
      for (const key of model.getIndexedKeys()) {
        const fields = ['$type', key];
        const name = fields.join('-');
        if (!newIndexes.some((o) => o.name === name)) {
          newIndexes.push({ name, fields });
        }
      }
    }

    const currentIndexes = await this.getIndexes();

    await Promise.all(
      newIndexes
        .filter((o) => !currentIndexes.some((i) => i.name === o.name))
        .map((o) =>
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

    this.stream.next({
      change,
      doc: value.doc,
    });
  }

  public watch(): Subject<GenericDocumentStream> {
    return this.stream;
  }
}
