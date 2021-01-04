import { expect } from 'chai';
import { GenericDoc } from '../src/document/document.interfaces';
import { Connection, Document, Schema } from '../src/public_api';
import { beforeEachOperations } from './utils';

let connection: Connection;
beforeEach(async () => {
  connection = await beforeEachOperations();
});

describe('Connection', async () => {
  it('should have only default indexes', async () => {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
    const indexes = await connection.getIndexes();
    expect(indexes.map((o) => o.name)).to.deep.equal(['$type']);
  });

  it('should create schema defined indexes', async () => {
    const PersonSchema = new Schema({
      name: {
        type: String,
        index: true,
      },
    });

    connection.model('Person', PersonSchema);

    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));

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

    const PersonSchema = new Schema({
      name: String,
    });

    interface Person extends Document {
      name: string;
    }

    const Person = connection.model<Person>('Person', PersonSchema);

    const jane = await Person.create({ name: 'Jane Doe' });

    expect(encryptCalled).to.equal(1);

    const jane2 = await Person.findById(jane._id);

    expect(decryptCalled).to.equal(1);

    expect(jane.toObject()).to.deep.equal(jane2.toObject());
  });
});
