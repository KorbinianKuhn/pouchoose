# Mongoose for PouchDB

**Heavily work in progress!**

Mongoose-like API for PouchDB.

## Connection

```typescript
import { connect } from 'pouchoose';

const connection = await connect('database-name', options);

await connection.countAllDocuments();

await connection.removeAllDocuments();

await connection.disconnect();
```

## Schema

```typescript
import { connect, model } from 'pouchoose';

// Interface is optional for TS
interface IPerson {
  name: string;
  age: nunmber;
}

// Define a Schema
const personSchema = new Schema({
  name: String,
  age: {
    type: Number,
    default: 42,
  },
});

// Create a Model (TS-Interface is optional)
const Person = model<IPerson>('Person', personSchema);
```

## Queries

```typescript
const doc = await Person.create({ name: 'Jane Doe' });

await Person.find().exec();
```

### Methods

- create(doc)
- insertMany(docs)
- find(conditions)
- findById(id)
- findOne(conditions)
- findAndUpdate(conditions, update)
- findByIdAndUpdate(id, update)
- findAndDelete(conditions)
- findByIdAndDelete(id)
