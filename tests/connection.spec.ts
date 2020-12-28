import { expect } from 'chai';
import * as PouchDB from 'pouchdb';
import * as PouchDBMemory from 'pouchdb-adapter-memory';
import { GenericDoc } from '../src/document/document.interfaces';
import {
  connect,
  Connection,
  Document,
  model,
  Schema,
} from '../src/public_api';

PouchDB.plugin(PouchDBMemory);

let connection: Connection;
before(async () => {
  connection = await connect('test', {
    adapter: 'memory',
  });
});

afterEach(async () => {
  delete connection.encrypt;
  delete connection.decrypt;
  await connection.removeAllDocuments();
});

describe('Connection', async () => {
  it('should have only default indexes', async () => {
    const indexes = await connection.getIndexes();
    expect(indexes.map((o) => o.name)).to.deep.equal(['$type']);
  });

  it('should create schema defined indexes', async () => {
    const personSchema = new Schema({
      name: {
        type: String,
        index: true,
      },
    });

    model('Person', personSchema);

    const indexes = await connection.getIndexes();
    expect(indexes.map((o) => o.name)).to.deep.equal(['$type', '$type-name']);
  });

  it('encryption and decryption should work', async () => {
    let encryptCalled = 0;
    connection.encrypt = async (docs: GenericDoc[]): Promise<GenericDoc[]> => {
      encryptCalled++;
      return docs.map((doc) => {
        const { name, ...rest } = doc;
        return {
          ...rest,
          $encrypted: JSON.stringify(name),
        };
      });
    };

    let decryptCalled = 0;
    connection.decrypt = async (docs: GenericDoc[]): Promise<GenericDoc[]> => {
      decryptCalled++;
      return docs.map((doc) => {
        const { $encrypted, ...rest } = doc;
        return {
          ...rest,
          name: JSON.parse($encrypted),
        };
      });
    };

    const personSchema = new Schema({
      name: String,
    });

    interface Person extends Document {
      name: string;
    }

    const Person = model<Person>('Person', personSchema);

    const jane = await Person.create({ name: 'Jane Doe' });

    expect(encryptCalled).to.equal(1);

    const jane2 = await Person.findById(jane._id);

    expect(decryptCalled).to.equal(1);

    expect(jane.toJSON()).to.deep.equal(jane2.toJSON());
  });
});
