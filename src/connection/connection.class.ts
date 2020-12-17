import * as PouchDB from 'pouchdb';
import * as PouchDBFind from 'pouchdb-find';
import { Subject } from 'rxjs';
import { DocumentChangeType } from './connection.enums';
import { DocumentChangedEvent } from './connection.interfaces';

PouchDB.plugin(PouchDBFind);

export class Connection {
  public db: PouchDB.Database;
  public docChanged: Subject<DocumentChangedEvent>;

  constructor(
    name: string,
    options?: PouchDB.Configuration.DatabaseConfiguration
  ) {
    this.init(name, options);
  }

  public init(
    name: string,
    options?: PouchDB.Configuration.DatabaseConfiguration
  ): void {
    this.db = new PouchDB(name, options);
    this.db
      .on('change', (value: PouchDB.Core.ChangesResponseChange<any>) => {
        this.docChanged.next({
          type: this.getChangeType(value),
          doc: value.doc,
        });
      })
      .on('error', (value: any) => console.error('error', value))
      .on('complete', (value: PouchDB.Core.ChangesResponse<any>) =>
        console.log('complete')
      );
  }

  disconnect() {}

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
}
