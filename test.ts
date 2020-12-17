import { connect, Document, model, Schema } from './src/public_api';

interface IPerson extends Document {
  name: string;
  age: number;
  nested: {
    verified: boolean;
  };
}

const personSchema = new Schema({
  name: String,
  age: {
    type: Number,
    default: 42,
  },
  nested: {
    verified: Boolean,
  },
});

const Person = model<IPerson>('person', personSchema);

const main = async () => {
  // const transformed = personSchema.transform({});
  // console.log(transformed);
  const connection = await connect('_pouch_test_db');
  // const person = await Person.create({ name: 'Jane Doe' });

  // const res1 = await Person.findOne({}).exec();
  // console.log(res1);

  // const res2 = await Person.find({}).exec();
  // console.log(res2);

  // const res3 = await Person.findById(
  //   'b9eaa400-c87b-4390-8cd0-1d9f61043e53'
  // ).exec();
  // console.log(res3);

  const res4 = await Person.findByIdAndUpdate(
    'b9eaa400-c87b-4390-8cd0-1d9f61043e53',
    {
      $set: {
        name: 'John Doe',
        age: 42,
      },
    }
  );
  console.log(res4);

  // console.log(person);
  // const persons = await Person.find({});
  // console.log(persons);
};

main()
  .then(() => console.log('finished'))
  .catch((err) => console.error(err));
