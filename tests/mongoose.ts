import { connect, createConnection, Document, model, Schema } from 'mongoose';

interface IPerson extends Document {
  name: string;
}

const PersonSchema = new Schema({
  name: String,
});

const Person = model<IPerson>('person', PersonSchema);

const main = async () => {
  const connection = await connect('');

  connection.disconnect();

  const conn2 = await createConnection('');

  console.log(Person);
  const p2 = await new Person().save();
  console.log(p2);
};

main();
