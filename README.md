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
const PersonSchema = new Schema({
  name: String,
  age: {
    type: Number,
    default: 42,
  },
});

// Create a Model (TS-Interface is optional)
const Person = model<IPerson>('Person', PersonSchema);
```

## Queries

```typescript
// Create person instantly
const jane = await Person.create({ name: 'Jane Doe' });

// Create person and save later
const john = Person.new({ name: 'John Doe' });
await john.save();

// Find persons
const persons = await Person.find();
```

### Methods

- count(conditions)
- create(doc)
- exists(conditions)
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
- new(doc)

### Populate

```typescript
const userSchema = new Schema({
  name: String,
  comments: [
    {
      type: String,
      ref: 'Comment',
    },
  ],
});
const User = model('User', userSchema);

const commentSchema = new Schema({
  message: String,
  user: {
    type: String,
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

Subscribe to changes on connection-, model- or document-level.

```typescript
import { Subscription } from 'rxjs';

const subscriptions = new Subscription();

// Subscribe to all doc changes. Docs are lean json-objects.
subscriptions.add(
  connection.watch().subscribe((e: GenericDocumentStream) => {
    console.log(e);
    // { change: 'add' | 'update' | 'delete', doc: any }
  })
);

// Subscribe to Person doc changes and filter only delete events. Docs are Document-Classes.
subscriptions.add(
  Person.watch()
    .filter((e: DocumentStream) => e.change === 'delete')
    .subscribe((e) => {
      console.log(e);
      // { change: 'add' | 'update' | 'delete', doc: IPerson }
    })
);

// Subscribe to all changes of a specific document
const jane = await Person.find({ name: 'Jane Doe' });
subscriptions.add(
  Person.watch().subscribe((e: DocumentStream) => {
    console.log(e);
    // { change: 'add' | 'update' | 'delete', doc: IPerson }
  })
);

// Don't forget to unsubscribe
subscriptions.unsubscribe();
```

## Encryption

Use callbacks to enable encryption with your custom logic and encryption library of choice (e.g. node-forge). These callbacks are executed on every CRUD-Operation, e.g. on a read-query before schema validation or on a write-query after schema validation.

```typescript
import { GenericDoc } from 'pouchoose';

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
    encrypted.$crypto = {
      alg: 'stringify',
      content: JSON.stringify(content),
    };

    return encrypted;
  });
};

connection.decrypt = async (docs: GenericDoc[]): Promise<GenericDoc[]> => {
  return docs.map((doc) => {
    const { $crypto, ...decrypted } = doc;

    // Eventually decrypt content
    if ($crypto) {
      Object.assign(decrypted, JSON.parse($crypto.content));
    }

    return decrypted;
  });
};
```
