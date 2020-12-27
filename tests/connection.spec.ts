import { expect } from 'chai';
import * as PouchDB from 'pouchdb';
import * as PouchDBMemory from 'pouchdb-adapter-memory';
import { connect, model, Schema } from '../src/public_api';

PouchDB.plugin(PouchDBMemory);

describe('Connection', async () => {
  it.only('should have only default indexes', async () => {
    const connection = await connect('test', {
      adapter: 'memory',
    });

    const res = await connection.db.getIndexes();
    expect(res.indexes.map((o) => o.name)).to.deep.equal([
      '$type',
      '_all_docs',
    ]);
  });

  it.only('automatic index creation should pass', async () => {
    const personSchema = new Schema({
      name: {
        type: String,
        index: true,
      },
    });

    const Person = model('Person', personSchema);

    const connection = await connect('test', {
      adapter: 'memory',
    });

    const res = await connection.db.getIndexes();
    expect(res.indexes.map((o) => o.name)).to.deep.equal([
      '$type',
      '$type-name',
      '_all_docs',
    ]);
  });
});
