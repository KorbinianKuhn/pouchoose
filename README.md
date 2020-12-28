# Pouchoose - Mongoose for PouchDB

**Heavily work in progress!**

Mongoose-like API for PouchDB.

- Schema definition (Validation, Hooks, Indexing)
- Powerful queries based on PouchDB-Find
- Populate schema references
- Optional encryption

## Connection

```typescript
import { connect } from 'pouchoose';

// Easily connect to a database
const connection = await connect('database-name');

// Count all documents
const count = await connection.countAllDocuments();

// Remove all documents
await connection.removeAllDocuments();

// Disconnect from the database
await connection.disconnect();
```

## Schema

```typescript
import { model, Schema } from 'pouchoose';

// TS-Interface is optional
interface IPerson {
  name: string;
  age: number;
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

const persons = await Person.find();
```

### Methods

- count(conditions)
- create(doc)
- find(conditions)
- findAndDelete(conditions)
- findAndUpdate(conditions, update)
- findById(id)
- findByIdAndDelete(id)
- findByIdAndUpdate(id, update)
- findOne(conditions)
- findOneAndDelete(conditions)
- findOneAndUpdate(conditions, update)
- insertMany(docs)

### Populate

```typescript
const userSchema = new Schema({
  name: String,
  comments: {
    type: 'Ref',
    ref: 'Comment',
  },
});
const User = model('User', userSchema);

const commentSchema = new Schema({
  message: String,
  user: {
    type: 'Ref',
    ref: 'User',
  },
});
const User = model('User', userSchema);

const userWithComments = await User.findOne({ name: 'Jane Doe' }).populate(
  'comments'
);
```

## Hooks

Not implemented

## Changes

## Encryption

Use callbacks to enable encryption with your custom logic and encryption library of choice (e.g. node-forge). These callbacks are executed on every CRUD-Operation, e.g. on a read-query before schema validation or on a write-query after schema validation.

```typescript
connection.encrypt = async (docs: GenericDoc[]): Promise<GenericDoc[]> => {
  return docs.map((doc) => {
    const encrypted: GenericDoc = {};
    const content: { [key: string]: any } = {};

    // Skip some keys for encryption
    for (const key of Object.keys(doc)) {
      if (key.startsWith('$') || key.startsWith('_')) {
        encrypted[key] = doc[key];
      } else {
        content[key] = doc[key];
      }
    }

    // Encrypt content
    encrypted.$encrypted = {
      alg: 'stringify',
      content: JSON.stringify(content),
    };

    return encrypted;
  });
};

connection.decrypt = async (docs: GenericDoc[]): Promise<GenericDoc[]> => {
  return docs.map((doc) => {
    const { $encrypted, ...decrypted } = doc;

    // Eventually decrypt content
    if ($encrypted) {
      Object.assign(decrypted, JSON.parse($encrypted.content));
    }

    return decrypted;
  });
};
```
