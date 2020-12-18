import { connect, Document, model, Schema } from 'mongoose';

const connection = connect('test');

interface IPerson extends Document {
  name: string;
}

const personSchema = new Schema({
  name: String,
});

const Person = model<IPerson>('person', personSchema);

const main = async () => {
  const person = await Person.create();

  const lean = await Person.findOne().lean();
};
