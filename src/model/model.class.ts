import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Connection } from '../connection/connection.class';
import { DocumentChangeType } from '../connection/connection.enums';
import { Document } from '../document/document.class';
import { ArrayQuery } from '../query/array-query.class';
import { QueryOperation } from '../query/query.enums';
import { FilterQuery, UpdateQuery } from '../query/query.interfaces';
import { Schema } from '../schema/schema.class';
import { DEFAULT_CONNECTION } from './../connection/connection.constants';
import { SingleQuery } from './../query/single-query.class';
import { ModelOptions } from './model.interfaces';
import { applyUpdateQueryToDocs } from './model.utils';

export class Model<T extends Document> {
  public changed = new Subject<T>();
  public added = new Subject<T>();
  public updated = new Subject<T>();
  public deleted = new Subject<T>();

  get connection(): Connection {
    return this.options.connection || DEFAULT_CONNECTION;
  }

  constructor(
    public name: string,
    private schema: Schema,
    private options: ModelOptions = {}
  ) {
    this.schema.setType(this.name);
    this.connection.registerModel(this);
    this.connection.docChanged
      .pipe(filter((event) => event.doc.$type === this.name))
      .subscribe((event) => {
        switch (event.type) {
          case DocumentChangeType.ADD:
            this.added.next(event.doc as T);
            break;
          case DocumentChangeType.UPDATE:
            this.added.next(event.doc as T);
            break;
          case DocumentChangeType.DELETE:
            this.added.next(event.doc as T);
            break;
        }
        this.changed.next(event.doc as T);
      });
  }

  getIndexedKeys(): string[] {
    return this.schema.getIndexedKeys();
  }

  async create(doc: Partial<T>): Promise<T> {
    const value = this.schema.validate(doc);

    const [encrypted] = this.connection.encrypt
      ? await this.connection.encrypt([value])
      : [value];

    const res = await this.connection.db.post(encrypted);

    return new Document(
      {
        ...value,
        _id: res.id,
        _rev: res.rev,
      },
      this
    ) as T;
  }

  async insertMany(docs: Partial<T>[]): Promise<T[]> {
    // TODO: encryption
    const values = docs.map((o) => this.schema.validate(o));

    const res = await this.connection.db.bulkDocs(values);

    for (let i = 0; i < values.length; i++) {
      values[i]._id = res[i].id;
      values[i]._rev = res[i].rev;
    }

    return values;
  }

  async count(conditions: FilterQuery = {}): Promise<number> {
    const res = await this.connection.db.find({
      selector: {
        ...conditions,
        $type: this.name,
      },
      fields: ['_id'],
    });

    return res.docs.length;
  }

  find(conditions: FilterQuery = {}): ArrayQuery<T> {
    return new ArrayQuery(
      {
        type: QueryOperation.FIND,
        request: {
          selector: {
            ...conditions,
            $type: this.name,
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
            ...conditions,
            $type: this.name,
          },
          limit: 1,
        },
      },
      this.connection,
      this.schema
    );
  }

  async findOneAndDelete(conditions: FilterQuery = {}): Promise<T> {
    // TODO: encryption
    const doc = await this.findOne(conditions);

    doc._deleted = true;

    const res = await this.connection.db.put(doc);

    doc._rev = res.rev;

    return doc;
  }

  async findOneAndUpdate(
    conditions: FilterQuery = {},
    update: UpdateQuery<T>
  ): Promise<T> {
    // TODO: encryption
    const doc = await this.findOne(conditions);

    applyUpdateQueryToDocs([doc], update);

    const res = await this.connection.db.put(doc);

    doc._rev = res.rev;

    return doc;
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
    // TODO: encryption
    const docs = await this.find(conditions);

    applyUpdateQueryToDocs(docs, update);

    const res = await this.connection.db.bulkDocs(docs.map((o) => o.toJSON()));
    for (let i = 0; i < docs.length; i++) {
      docs[i]._rev = res[i].rev;
    }

    return docs;
  }

  async findByIdAndUpdate(id: string, update: UpdateQuery<T>): Promise<T> {
    // TODO: encryption
    const res = await this.connection.db.get(id);

    const doc = new Document(res, this) as T;

    applyUpdateQueryToDocs([doc], update);

    const res2 = await this.connection.db.put(doc);

    doc._rev = res2.rev;

    return doc;
  }

  async findAndDelete(conditions: FilterQuery = {}): Promise<T[]> {
    // TODO: encryption
    return this.findAndUpdate(conditions, { $set: { _deleted: true } });
  }

  async findByIdAndDelete(id: string): Promise<T> {
    // TODO: encryption
    return this.findByIdAndUpdate(id, { $set: { _deleted: true } });
  }
}
