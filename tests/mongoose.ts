import { Document, model, Schema } from 'mongoose';

interface IPerson extends Document {
  name: string;
}

const personSchema = new Schema({
  name: String,
});

const Person = model<IPerson>('person', personSchema);

const main = async () => {
  console.log(Person);
  const p2 = await new Person().save();
  console.log(p2);
};

main();
