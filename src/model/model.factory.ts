import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { GenericDoc } from '../..';
import { Connection } from '../connection/connection.class';
import { DocumentStream, LeanDocument } from '../document/document.interfaces';
import { ArrayQuery } from '../query/array-query.class';
import { QueryOperation } from '../query/query.enums';
import { FilterQuery, UpdateQuery } from '../query/query.interfaces';
import { SingleQuery } from '../query/single-query.class';
import { Schema } from '../schema/schema.class';
import { Document } from './../document/document.class';
import { Model } from './model.interfaces';
import { applyUpdateQueryToDocs } from './model.utils';

export const createModel = <T extends Document, U extends Model<T> = Model<T>>(
  name: string,
  schema: Schema,
  connection: Connection
): U => {
  const model: Model<T> = function Model(doc?: Partial<T>) {
    return new Document(
      {
        ...doc,
      },
      model
    ) as T;
  } as any;

  model.modelName = name;
  model.connection = connection;

  // Schema
  model.schema = schema;
  model.schema.setType(name);
  for (const [name, fn] of Object.entries(model.schema.statics)) {
    model[name] = fn;
  }

  // Connection
  const stream = new Subject<DocumentStream<T>>();
  model.connection
    .watch()
    .pipe(filter((event) => event.doc.$type === name))
    .subscribe((event) => {
      stream.next({
        change: event.change,
        doc: new Document(event.doc, model) as T,
      });
    });

  function preWrite(
    docs: Array<LeanDocument<T> | Partial<LeanDocument<T>>>
  ): LeanDocument<T>[] {
    return docs.map((o) => {
      const data = model.schema.validate(o);

      // Timestamps
      if (model.schema.options.timestamps) {
        data.createdAt ??= new Date();
        data.modifiedAt = new Date();
      }

      return data;
    });
  }

  async function encrypt(docs: GenericDoc[]): Promise<GenericDoc[]> {
    if (model.connection.encrypt) {
      return model.connection.encrypt(docs);
    }
    return docs;
  }

  async function decrypt(docs: GenericDoc[]): Promise<GenericDoc[]> {
    if (model.connection.decrypt) {
      return model.connection.decrypt(docs);
    }
    return docs;
  }

  model.watch = (): Subject<DocumentStream<T>> => {
    return stream;
  };

  model.create = async (doc?: Partial<T>): Promise<T> => {
    const [value] = preWrite([doc || {}]);
    const [encrypted] = await encrypt([value]);

    const res = await model.connection.db.post(encrypted);

    return new Document(
      {
        ...value,
        _id: res.id,
        _rev: res.rev,
      },
      model
    ) as T;
  };

  model.insertMany = async (docs: Partial<LeanDocument<T>>[]): Promise<T[]> => {
    const values = preWrite(docs);
    const encrypted = await encrypt(values);

    const res = await model.connection.db.bulkDocs(encrypted);

    for (let i = 0; i < values.length; i++) {
      values[i]._id = res[i].id;
      values[i]._rev = res[i].rev;
    }

    return values.map((o) => new Document(o, model) as T);
  };

  model.count = async (conditions: FilterQuery = {}): Promise<number> => {
    const res = await model.connection.db.find({
      selector: {
        ...conditions,
        $type: name,
      },
      fields: ['_id'],
    });

    return res.docs.length;
  };

  model.exists = async (conditions: FilterQuery = {}): Promise<boolean> => {
    const res = await model.findOne(conditions).lean();
    return res !== null;
  };

  model.find = (conditions: FilterQuery = {}): ArrayQuery<T> => {
    return new ArrayQuery(
      {
        type: QueryOperation.FIND,
        request: {
          selector: {
            ...conditions,
            $type: name,
          },
        },
      },
      model
    );
  };

  model.findOne = (conditions: FilterQuery = {}): SingleQuery<T> => {
    return new SingleQuery(
      {
        type: QueryOperation.FIND_ONE,
        request: {
          selector: {
            ...conditions,
            $type: name,
          },
          limit: 1,
        },
      },
      model
    );
  };

  model.findOneAndDelete = async (conditions: FilterQuery = {}): Promise<T> => {
    return model.findOneAndUpdate(conditions, {
      $set: { _deleted: true },
    });
  };

  model.findOneAndUpdate = async (
    conditions: FilterQuery = {},
    update: UpdateQuery<T>
  ): Promise<T> => {
    // Find doc
    const doc = await model.findOne(conditions);

    if (doc === null) {
      return null;
    }

    // Apply updates
    applyUpdateQueryToDocs([doc], update);

    // Write doc
    const [validated] = preWrite([doc.toObject()]);
    const [encrypted] = await encrypt([validated]);
    const res = await model.connection.db.put(encrypted);

    // Get revision and return updated document
    validated._rev = res.rev;

    return new Document(validated, model) as T;
  };

  model.findById = (id: string): SingleQuery<T> => {
    return new SingleQuery(
      {
        type: QueryOperation.FIND_BY_ID,
        request: {
          selector: {
            $type: name,
            _id: id,
          },
        },
      },
      model
    );
  };

  model.findAndUpdate = async (
    conditions: FilterQuery = {},
    update: UpdateQuery<T>
  ): Promise<T[]> => {
    // Find docs
    const docs = await model.find(conditions);

    // Apply updates
    applyUpdateQueryToDocs(docs, update);

    // Write docs
    const validated = preWrite(docs.map((o) => o.toObject()));
    const encrypted = await encrypt(validated);
    const res = await model.connection.db.bulkDocs(encrypted);

    // Get revisions and return updated documents
    for (let i = 0; i < validated.length; i++) {
      validated[i]._rev = res[i].rev;
    }

    return validated.map((o) => new Document(o, model) as T);
  };

  model.findByIdAndUpdate = async (
    id: string,
    update: UpdateQuery<T>
  ): Promise<T> => {
    return model.findOneAndUpdate({ _id: id }, update);
  };

  model.findAndDelete = async (conditions: FilterQuery = {}): Promise<T[]> => {
    return model.findAndUpdate(conditions, { $set: { _deleted: true } });
  };

  model.findByIdAndDelete = async (id: string): Promise<T> => {
    return model.findOneAndDelete({ _id: id });
  };

  return model as U;
};
