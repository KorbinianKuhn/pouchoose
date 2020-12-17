import { Subject } from 'rxjs';
import { Connection } from '../connection/connection.class';
import { getDefaultConnection } from '../connection/connection.constants';
import { Document } from '../document/document.class';
import { Query } from '../query/query.class';
import { FilterQuery, UpdateQuery } from '../query/query.interfaces';
import { Schema } from '../schema/schema.class';
import { ModelOptions } from './model.interfaces';

export class Model<T extends Document<T>> {
  public changed = new Subject<T>();
  public added = new Subject<T>();
  public updated = new Subject<T>();
  public deleted = new Subject<T>();

  get connection(): Connection {
    return this.options.connection || getDefaultConnection();
  }

  constructor(
    private name: string,
    private schema: Schema<T>,
    private options: ModelOptions = {}
  ) {
    // this.connection.docChanged
    //   .pipe(filter((event) => event.doc.$type === this.name))
    //   .subscribe((event) => {
    //     switch (event.type) {
    //       case DocumentChangeType.ADD:
    //         this.added.next(event.doc as T);
    //         break;
    //       case DocumentChangeType.UPDATE:
    //         this.added.next(event.doc as T);
    //         break;
    //       case DocumentChangeType.DELETE:
    //         this.added.next(event.doc as T);
    //         break;
    //     }
    //     this.changed.next(event.doc as T);
    //   });
  }

  async create(partial: Partial<T>): Promise<Document<T>> {
    // TODO transform through schema
    const doc = partial;

    const res = await this.connection.db.post(doc);

    return new Document<T>({
      ...doc,
      _id: res.id,
      _rev: res.rev,
    });
  }

  find(conditions: FilterQuery): Query<T> {
    return new Query(
      {
        selector: {
          $type: this.name,
          ...conditions,
        },
      },
      this.connection
    );
  }

  findOne(conditions: FilterQuery): Query<T> {
    return new Query(
      {
        selector: {
          $type: this.name,
          ...conditions,
        },
        limit: 1,
      },
      this.connection
    );
  }

  findById(id: string): Query<T> {
    return new Query(
      {
        selector: {
          $type: this.name,
          _id: id,
        },
      },
      this.connection
    );
  }

  async findAndUpdate(
    conditions: FilterQuery,
    update: UpdateQuery<T>
  ): Promise<Document<T>[]> {
    return [];
  }

  async findByIdAndUpdate(
    id: string,
    update: UpdateQuery<T>
  ): Promise<Document<T>> {
    const res = await this.connection.db.get(id);

    const doc = new Document<T>(res);

    for (const operation of Object.keys(update)) {
      switch (operation) {
        case '$set': {
          for (const path of Object.keys(update.$set)) {
            doc.set(path, update.$set[path]);
          }
        }
      }
    }

    return doc;
  }

  async findAndDelete(conditions: FilterQuery): Promise<Document[]> {
    return [];
  }

  async findByIdAndDelete(id: string): Promise<Document<T>> {
    const doc = await this.connection.db.get(id);
    await this.connection.db.remove(doc);
    return new Document<T>(doc);
  }
}
