import * as PouchDB from 'pouchdb';
import * as PouchDBFind from 'pouchdb-find';
import { Subject } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { v4 } from 'uuid';
import { createModel } from '../model/model.factory';
import { Model } from '../model/model.interfaces';
import { Schema } from '../schema/schema.class';
import { SyncHandler } from '../sync-handler/sync-handler.class';
import { Document } from './../document/document.class';
import {
  DocumentChange,
  GenericDoc,
  GenericDocumentStream,
} from './../document/document.interfaces';
import { PouchooseError } from './../errors/pouchoose.error';
import { ReadyState } from './connection.enums';
import {
  DecryptionCallback,
  EncryptionCallback,
} from './connection.interfaces';

PouchDB.plugin(PouchDBFind);

export class Connection {
  private options: PouchDB.Configuration.DatabaseConfiguration;
  private dbChanges: PouchDB.Core.Changes<any>;
  private stream = new Subject<GenericDocumentStream>();
  public models: { [index: string]: Model<any> } = {};
  private updateIndexes: Subject<void> = new Subject();

  public name: string;

  /**
   * Connection ready state
   * 0 = disconnected
   * 1 = connected
   * 2 = connecting
   * 3 = disconnecting
   * Each state change emits its associated event name.
   */
  public readyState: number = ReadyState.DISCONNECTED;

  public _db: PouchDB.Database;
  public encrypt: EncryptionCallback;
  public decrypt: DecryptionCallback;

  get db(): PouchDB.Database {
    if (this.readyState !== ReadyState.CONNECTED) {
      throw new PouchooseError('Database is not connected', 'DB_NOT_CONNECTED');
    }
    return this._db;
  }

  constructor() {
    this.updateIndexes
      .pipe(
        debounceTime(10),
        filter(() => this.readyState === ReadyState.CONNECTED)
      )
      .subscribe(async () => {
        const indexes: { [name: string]: string[] } = {
          $type: ['$type'],
        };
        for (const model of Object.values(this.models)) {
          for (const key of model.schema.getIndexedKeys()) {
            indexes[`$type-${key}`] = ['$type', key];
          }
        }
        const currentIndexes = await this.getIndexes();
        await Promise.all(
          Object.keys(indexes)
            .filter((name) => !currentIndexes.some((i) => i.name === name))
            .map((name) =>
              this.db.createIndex({
                index: {
                  name: name,
                  fields: indexes[name],
                },
              })
            )
        );
      });
  }

  public configure(
    name: string,
    options?: PouchDB.Configuration.DatabaseConfiguration
  ) {
    this.name = name;
    this.options = options;
  }

  public async disconnect(): Promise<void> {
    if (this.readyState !== ReadyState.CONNECTED) {
      throw new PouchooseError(
        'Cannot disconnect, database is not connected',
        'DB_NOT_CONNECTED'
      );
    }

    this.readyState = ReadyState.DISCONNECTING;
    this.dbChanges.cancel();
    delete this.dbChanges;
    await this._db.close();
    this.readyState = ReadyState.DISCONNECTED;
  }

  public async reconnect(): Promise<void> {
    if (this.readyState !== ReadyState.DISCONNECTED) {
      throw new PouchooseError(
        'Cannot reconnect, database is already connected',
        'DB_IS_CONNECTED'
      );
    }

    this.readyState = ReadyState.CONNECTING;

    // Create DB
    this._db = new PouchDB(this.name, this.options);

    // Listen for events
    this.dbChanges = this._db
      .changes({ live: true, since: 'now', include_docs: true })
      .on('change', (value: PouchDB.Core.ChangesResponseChange<any>) =>
        this.onPouchdbChange(value)
      )
      .on('error', (value: any) => console.error('error', value));
    // .on('complete', (value: PouchDB.Core.ChangesResponse<any>) => {});

    this.readyState = ReadyState.CONNECTED;

    this.updateIndexes.next();
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

  public async isDbEmpty(includeIndexDocs = false): Promise<boolean> {
    const count = await this.countAllDocuments(includeIndexDocs);
    return count === 0;
  }

  public async countAllDocuments(includeIndexDocs = false): Promise<number> {
    if (includeIndexDocs) {
      const info = await this.db.info();
      return info.doc_count;
    } else {
      const [info, indexes] = await Promise.all([
        this.db.info(),
        this.getIndexes(),
      ]);
      return info.doc_count - indexes.length;
    }
  }

  public async getAllDocuments(): Promise<GenericDoc[]> {
    const res = await this.db.allDocs({ include_docs: true });
    return res.rows.map((row) => row.doc);
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

  public async dropDatabase(): Promise<void> {
    if (this.readyState !== ReadyState.CONNECTED) {
      throw new PouchooseError(
        'Cannot drop database, db is not connected',
        'DB_NOT_CONNECTED'
      );
    }
    this.readyState = ReadyState.DISCONNECTING;
    this.dbChanges.cancel();
    delete this.dbChanges;
    await this._db.destroy();
    delete this._db;
    this.readyState = ReadyState.DISCONNECTED;
  }

  /**
   * Defines a model or retrieves it.
   * Models defined on the pouchoose instance are available to all connection created by the same pouchoose instance.
   */
  public model<T extends Document = any, U extends Model<T> = Model<T>>(
    name: string,
    schema: Schema
  ): U {
    if (Object.keys(this.models).includes(name)) {
      throw new PouchooseError(
        `Model with name ${name} already exists`,
        'DUPLICATE_MODEL_NAME'
      );
    }

    const ret = createModel<T, U>(name, schema, this);

    this.models[name] = ret;

    this.updateIndexes.next();

    return ret;
  }

  /**
   * Removes the model named `name` from this connection, if it exists. You can
   * use this function to clean up any models you created in your tests to
   * prevent OverwriteModelErrors.
   *
   */
  public deleteModel(name: string | RegExp): this {
    for (const key of Object.keys(this.models).filter((k) => k.match(name))) {
      delete this.models[key];
    }
    return this;
  }

  /** Returns an array of model names created on this connection. */
  public modelNames(): string[] {
    return Object.keys(this.models);
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
