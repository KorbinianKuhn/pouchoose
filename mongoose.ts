import { connect, model, Schema } from 'mongoose';

const connection = connect('test');

const personSchema = new Schema({
  name: String,
});

const Person = model('person', personSchema);

const main = async () => {
  const persons = await Person.find();
};
