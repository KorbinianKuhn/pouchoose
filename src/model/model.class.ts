import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Connection } from '../connection/connection.class';
import { Document } from '../document/document.class';
import { ArrayQuery } from '../query/array-query.class';
import { QueryOperation } from '../query/query.enums';
import { FilterQuery, UpdateQuery } from '../query/query.interfaces';
import { Schema } from '../schema/schema.class';
import { DEFAULT_CONNECTION } from './../connection/connection.constants';
import { DocumentStream, GenericDoc } from './../document/document.interfaces';
import { SingleQuery } from './../query/single-query.class';
import { ModelOptions } from './model.interfaces';
import { applyUpdateQueryToDocs } from './model.utils';

export class Model<T extends Document> {
  private stream = new Subject<DocumentStream<T>>();

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
    this.connection
      .watch()
      .pipe(filter((event) => event.doc.$type === this.name))
      .subscribe((event) => {
        this.stream.next({
          change: event.change,
          doc: new Document(event.doc, this) as T,
        });
      });
  }

  public watch(): Subject<DocumentStream<T>> {
    return this.stream;
  }

  public getIndexedKeys(): string[] {
    return this.schema.getIndexedKeys();
  }

  private preWrite(docs: Array<T | Partial<T>>): T[] {
    return docs.map((o) => {
      const data = this.schema.validate(o);

      // Timestamps
      if (this.schema.options.timestamps) {
        data.createdAt ??= new Date();
        data.modifiedAt = new Date();
      }

      return data;
    });
  }

  private async encrypt(docs: T[]): Promise<GenericDoc[]> {
    if (this.connection.encrypt) {
      return this.connection.encrypt(docs);
    }
    return docs;
  }

  private async decrypt(docs: GenericDoc[]): Promise<GenericDoc[]> {
    if (this.connection.decrypt) {
      return this.connection.decrypt(docs);
    }
    return docs;
  }

  public async create(doc: Partial<T>): Promise<T> {
    const [value] = this.preWrite([doc]);
    const [encrypted] = await this.encrypt([value]);

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

  public new(doc: Partial<T>): T {
    const [value] = this.preWrite([doc]);

    return new Document(
      {
        ...value,
      },
      this
    ) as T;
  }

  public async insertMany(docs: Partial<T>[]): Promise<T[]> {
    const values = this.preWrite(docs);
    const encrypted = await this.encrypt(values);

    const res = await this.connection.db.bulkDocs(encrypted);

    for (let i = 0; i < values.length; i++) {
      values[i]._id = res[i].id;
      values[i]._rev = res[i].rev;
    }

    return values;
  }

  public async count(conditions: FilterQuery = {}): Promise<number> {
    const res = await this.connection.db.find({
      selector: {
        ...conditions,
        $type: this.name,
      },
      fields: ['_id'],
    });

    return res.docs.length;
  }

  public async exists(conditions: FilterQuery = {}): Promise<boolean> {
    const res = await this.findOne(conditions).lean();
    return res !== null;
  }

  public find(conditions: FilterQuery = {}): ArrayQuery<T> {
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

  public findOne(conditions: FilterQuery = {}): SingleQuery<T> {
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

  public async findOneAndDelete(conditions: FilterQuery = {}): Promise<T> {
    return this.findOneAndUpdate(conditions, {
      $set: { _deleted: true },
    });
  }

  public async findOneAndUpdate(
    conditions: FilterQuery = {},
    update: UpdateQuery<T>
  ): Promise<T> {
    // Find doc
    const doc = await this.findOne(conditions);

    if (doc === null) {
      return null;
    }

    // Apply updates
    applyUpdateQueryToDocs([doc], update);

    // Write doc
    const [encrypted] = await this.encrypt([doc.toJSON()]);
    const res = await this.connection.db.put(encrypted);

    // Get revision and return updated document
    doc._rev = res.rev;
    return doc;
  }

  public findById(id: string): SingleQuery<T> {
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

  public async findAndUpdate(
    conditions: FilterQuery = {},
    update: UpdateQuery<T>
  ): Promise<T[]> {
    // Find docs
    const docs = await this.find(conditions);

    // Apply updates
    applyUpdateQueryToDocs(docs, update);

    // Write docs
    const encrypted = await this.encrypt(docs.map((o) => o.toJSON()));
    const res = await this.connection.db.bulkDocs(encrypted);

    // Get revisions and return updated documents
    for (let i = 0; i < docs.length; i++) {
      docs[i]._rev = res[i].rev;
    }
    return docs;
  }

  public async findByIdAndUpdate(
    id: string,
    update: UpdateQuery<T>
  ): Promise<T> {
    return this.findOneAndUpdate({ _id: id }, update);
  }

  public async findAndDelete(conditions: FilterQuery = {}): Promise<T[]> {
    return this.findAndUpdate(conditions, { $set: { _deleted: true } });
  }

  public async findByIdAndDelete(id: string): Promise<T> {
    return this.findOneAndDelete({ _id: id });
  }
}
