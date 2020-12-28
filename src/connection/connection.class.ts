import * as PouchDB from 'pouchdb';
import * as PouchDBFind from 'pouchdb-find';
import { Subject } from 'rxjs';
import { Model } from '../model/model.class';
import { GenericDoc } from './../document/document.interfaces';
import { DocumentChangeType } from './connection.enums';
import {
  DecryptionCallback,
  DocumentChangedEvent,
  EncryptionCallback,
} from './connection.interfaces';

PouchDB.plugin(PouchDBFind);

export class Connection {
  public name: string;

  private options: PouchDB.Configuration.DatabaseConfiguration;
  private dbChanges: PouchDB.Core.Changes<any>;
  private dbSyncHandler;
  private models: Model<any>[] = [];

  public db: PouchDB.Database;
  public docChanged: Subject<DocumentChangedEvent> = new Subject();
  private docChangedEventsEnabled: boolean;

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
    this.dbChanges = null;
    await this.db.close();
  }

  public async reconnect(): Promise<void> {
    // Create DB
    this.db = new PouchDB(this.name, this.options);

    // Listen for events
    this.docChangedEventsEnabled = true;
    this.dbChanges = this.db
      .changes({ live: true, since: 'now', include_docs: true })
      .on('change', (value: PouchDB.Core.ChangesResponseChange<any>) => {
        if (this.docChangedEventsEnabled) {
          this.docChanged.next({
            type: this.getChangeType(value),
            doc: value.doc,
          });
        }
      })
      .on('error', (value: any) => console.error('error', value));
    // .on('complete', (value: PouchDB.Core.ChangesResponse<any>) => {});

    // Create indexes
    await this.ensureIndexes();
  }

  public enableEvents(): void {
    this.docChangedEventsEnabled = true;
  }

  public disableEvents(): void {
    this.docChangedEventsEnabled = false;
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
    this.dbChanges = null;
    await this.db.destroy();
    this.db = null;
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

  private getChangeType(
    value: PouchDB.Core.ChangesResponseChange<any>
  ): DocumentChangeType {
    if (value.deleted) {
      return DocumentChangeType.DELETE;
    } else if (value.doc._rev && /^1-.*/.test(value.doc._rev)) {
      return DocumentChangeType.ADD;
    } else {
      return DocumentChangeType.UPDATE;
    }
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
}
