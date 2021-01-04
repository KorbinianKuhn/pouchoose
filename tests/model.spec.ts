import { expect } from 'chai';
import { Model } from '../src/model/model.interfaces';
import { Connection, Document, Schema } from '../src/public_api';
import { beforeEachOperations } from './utils';

interface IPerson extends Document {
  name: string;
  age: number;
}

const PersonSchema = new Schema({
  name: String,
  age: {
    type: Number,
    default: 42,
  },
});

let connection: Connection;
let Person: Model<IPerson>;

beforeEach(async () => {
  connection = await beforeEachOperations();
  Person = connection.model<IPerson>('Person', PersonSchema);
});

describe('Model', async () => {
  it('create()', async () => {
    const person = await Person.create({ name: 'Jane Doe' });

    expect(person.toObject()).to.deep.equal({
      $type: 'Person',
      name: 'Jane Doe',
      age: 42,
      _id: person._id,
      _rev: person._rev,
    });

    const count = await connection.countAllDocuments();
    expect(count).to.equal(1);
  });

  it('new()', async () => {
    const jane = new Person({ name: 'Jane Doe' });
    await jane.save();

    const res = await Person.findOne({ name: 'Jane Doe' });

    expect(res.toObject()).to.deep.equal(jane.toObject());
  });

  it('insertMany()', async () => {
    await Person.insertMany([{ name: 'Jane Doe' }, { name: 'John Doe' }]);

    const count = await connection.countAllDocuments();
    expect(count).to.equal(2);
  });

  it('count()', async () => {
    const count = await Person.count();
    expect(count).to.equal(0);

    await Person.insertMany([{ name: 'Jane Doe' }, { name: 'Jane Doe' }]);
    const count2 = await Person.count();
    expect(count2).to.equal(2);
  });

  it('exists()', async () => {
    const exists = await Person.exists({ name: 'Jane Doe' });
    expect(exists).to.be.false;

    await Person.create({ name: 'Jane Doe' });
    const exists2 = await Person.exists({ name: 'Jane Doe' });
    expect(exists2).to.be.true;
  });

  it('find()', async () => {
    const person = await Person.create({ name: 'Jane Doe' });

    const res = await Person.find();

    expect(person.toObject()).to.deep.equal(res[0].toObject());

    await Person.create({ name: 'John Doe' });

    const res2 = await Person.find();
    expect(res2).to.have.lengthOf(2);
  });

  it('findOne()', async () => {
    const person = await Person.create({ name: 'Jane Doe' });

    const res = await Person.findOne();

    expect(person.toObject()).to.deep.equal(res.toObject());
  });

  it('findById()', async () => {
    const person = await Person.create({ name: 'Jane Doe' });

    person.toObject();

    const res = await Person.findById(person._id);

    expect(person.toObject()).to.deep.equal(res.toObject());
  });

  it('findAndUpdate()', async () => {
    const jane = await Person.create({ name: 'Jane Doe' });
    const john = await Person.create({ name: 'John Doe' });

    const docs = await Person.findAndUpdate({}, { $set: { age: 22 } });

    expect(docs.length).to.equal(2);

    for (const doc of docs) {
      expect(doc.age).to.equal(22);
      expect([jane._rev, john._rev]).not.to.include(doc._rev);
      expect(doc._rev.startsWith('2')).to.be.true;
    }
  });

  it('findByIdAndUpdate()', async () => {
    await Person.create({ name: 'Jane Doe' });
    const john = await Person.create({ name: 'John Doe' });

    const doc = await Person.findByIdAndUpdate(john._id, { $set: { age: 22 } });

    expect({
      _id: doc._id,
      name: doc.name,
      age: doc.age,
    }).to.deep.equal({
      _id: john._id,
      name: john.name,
      age: 22,
    });
  });

  it('findAndDelete()', async () => {
    await Person.insertMany([
      { name: 'Jane Doe' },
      { name: 'John Doe' },
      { name: 'Lisa Doe' },
    ]);

    const count = await connection.countAllDocuments();
    expect(count).to.equal(3);

    const res = await Person.findAndDelete({ name: 'John Doe' });
    expect(res[0].name).to.equal('John Doe');
    expect(res[0]._deleted).to.be.true;

    const count2 = await connection.countAllDocuments();
    expect(count2).to.equal(2);

    const res2 = await Person.findAndDelete();
    expect(res2.length).to.equal(2);
    expect(res2[0]._deleted).to.be.true;
    expect(res2[1]._deleted).to.be.true;

    const count3 = await connection.countAllDocuments();
    expect(count3).to.equal(0);
  });

  it('findByIdAndDelete()', async () => {
    const res = await Person.insertMany([
      { name: 'Jane Doe' },
      { name: 'John Doe' },
      { name: 'Lisa Doe' },
    ]);

    const john = res[1];

    const doc = await Person.findByIdAndDelete(john._id);
    expect(doc._id).to.equal(john._id);
    expect(doc._deleted).to.be.true;

    const count = await connection.countAllDocuments();
    expect(count).to.equal(2);
  });
});
