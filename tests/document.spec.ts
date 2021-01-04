import { expect } from 'chai';
import { Model } from '../src/model/model.interfaces';
import { Connection, Document, Schema } from '../src/public_api';
import { beforeEachOperations } from './utils';

let connection: Connection;

interface IPerson extends Document {
  firstname: string;
  lastname: string;
  name(): string;
  fullname(prefix: string): string;
}

let Person: Model<IPerson>;
let PersonSchema: Schema;
beforeEach(async () => {
  connection = await beforeEachOperations();
  PersonSchema = new Schema({
    firstname: String,
    lastname: String,
  });
  PersonSchema.virtual('name').get(function () {
    return `${this.firstname} ${this.lastname}`;
  });

  PersonSchema.method('fullname', function (prefix: string) {
    return `${prefix}${this.firstname} ${this.lastname}`;
  });
  Person = connection.model('Person', PersonSchema);
});

describe('Document', async () => {
  it('toObject() should return only doc properties', async () => {
    const jane = await Person.create({ firstname: 'Jane', lastname: 'Doe' });
    expect(jane.name).to.equal('Jane Doe');
    expect(jane.fullname('Mrs. ')).to.equal('Mrs. Jane Doe');

    expect(jane.toObject()).deep.equal({
      $type: 'Person',
      firstname: 'Jane',
      lastname: 'Doe',
      _id: jane._id,
      _rev: jane._rev,
    });
  });

  it('version() should return correct version number', async () => {
    let jane = await Person.create({ firstname: 'Jane', lastname: 'Doe' });
    expect(jane.version()).to.equal(1);

    jane = await Person.findByIdAndUpdate(jane._id, {
      $set: { lastname: 'Doe 2' },
    });

    expect(jane.version()).to.equal(2);
  });
});
