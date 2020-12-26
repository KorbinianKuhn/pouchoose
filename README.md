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

// TS-Interface is optional
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

// Read Queries require exec() call at the end
await Person.find().exec();
```

### Create

- create(doc)
- insertMany(docs)

### Read

- find(conditions).exec()
- findById(id).exec()
- findOne(conditions).exec()

### Update

- findAndUpdate(conditions, update)
- findByIdAndUpdate(id, update)

### Delete

- findAndDelete(conditions)
- findByIdAndDelete(id)

## Hooks

Not implemented

## Changes
