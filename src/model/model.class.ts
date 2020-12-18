import { Subject } from 'rxjs';
import { Connection } from '../connection/connection.class';
import { getDefaultConnection } from '../connection/connection.constants';
import { Document } from '../document/document.class';
import { ArrayQuery } from '../query/array-query.class';
import { QueryOperation } from '../query/query.enums';
import { FilterQuery, UpdateQuery } from '../query/query.interfaces';
import { Schema } from '../schema/schema.class';
import { SingleQuery } from './../query/single-query.class';
import { ModelOptions } from './model.interfaces';

export class Model<T extends Document> {
  public changed = new Subject<T>();
  public added = new Subject<T>();
  public updated = new Subject<T>();
  public deleted = new Subject<T>();

  get connection(): Connection {
    return this.options.connection || getDefaultConnection();
  }

  constructor(
    private name: string,
    private schema: Schema,
    private options: ModelOptions = {}
  ) {
    this.schema.setType(this.name);
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

  async create(doc: Partial<T>): Promise<T> {
    const value = this.schema.validate(doc);

    const res = await this.connection.db.post(value);

    return new Document({
      ...value,
      _id: res.id,
      _rev: res.rev,
    }) as T;
  }

  async insertMany(docs: Partial<T>[]): Promise<T[]> {
    const values = docs.map((o) => this.schema.validate(o));

    const res = await this.connection.db.bulkDocs(values);

    for (let i = 0; i < values.length; i++) {
      values[i]._id = res[i].id;
      values[i]._rev = res[i].rev;
    }

    return values;
  }

  find(conditions: FilterQuery = {}): ArrayQuery<T> {
    return new ArrayQuery(
      {
        type: QueryOperation.FIND,
        request: {
          selector: {
            $type: this.name,
            ...conditions,
          },
        },
      },
      this.connection,
      this.schema
    );
  }

  findOne(conditions: FilterQuery = {}): SingleQuery<T> {
    return new SingleQuery(
      {
        type: QueryOperation.FIND_ONE,
        request: {
          selector: {
            $type: this.name,
            ...conditions,
          },
          limit: 1,
        },
      },
      this.connection,
      this.schema
    );
  }

  findById(id: string): SingleQuery<T> {
    return new SingleQuery(
      {
        type: QueryOperation.FIND_BY_ID,
        request: {
          selector: {
            $type: this.name,
            _id: id,
          },
        },
      },
      this.connection,
      this.schema
    );
  }

  async findAndUpdate(
    conditions: FilterQuery = {},
    update: UpdateQuery<T>
  ): Promise<T[]> {
    const docs = await this.find(conditions).exec();

    for (const doc of docs) {
      for (const operation of Object.keys(update)) {
        switch (operation) {
          case '$set': {
            for (const path of Object.keys(update.$set)) {
              doc.set(path, update.$set[path]);
            }
          }
        }
      }
    }

    const res = await this.connection.db.bulkDocs(docs.map((o) => o.toJSON()));
    for (let i = 0; i < docs.length; i++) {
      docs[i]._rev = res[i].rev;
    }

    return docs;
  }

  async findByIdAndUpdate(id: string, update: UpdateQuery<T>): Promise<T> {
    const res = await this.connection.db.get(id);

    const doc = new Document(res) as T;

    for (const operation of Object.keys(update)) {
      switch (operation) {
        case '$set': {
          for (const path of Object.keys(update.$set)) {
            doc.set(path, update.$set[path]);
          }
        }
      }
    }

    const res2 = await this.connection.db.put(doc);

    doc._rev = res2.rev;

    return doc;
  }

  async findAndDelete(conditions: FilterQuery = {}): Promise<T[]> {
    return this.findAndUpdate(conditions, { $set: { _deleted: true } });
  }

  async findByIdAndDelete(id: string): Promise<T> {
    return this.findByIdAndUpdate(id, { $set: { _deleted: true } });
  }
}
