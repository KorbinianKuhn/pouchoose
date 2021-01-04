import { expect } from 'chai';
import { Model } from '../src/model/model.interfaces';
import { Connection, Document, Schema } from '../src/public_api';
import { beforeEachOperations } from './utils';

let connection: Connection;

beforeEach(async () => {
  connection = await beforeEachOperations();
});

describe('Schema', async () => {
  it('array with shorthand definition', async () => {
    const schema = new Schema({
      hobbies: [String],
    });

    expect(() =>
      schema.validate({ hobbies: ['programming', 'fishing'] })
    ).to.not.throw();

    expect(() => schema.validate({ hobbies: [1, 2] })).to.throw();
  });

  it('array with type definition', async () => {
    const schema = new Schema({
      hobbies: {
        type: [String],
        default: [],
      },
    });

    expect(() =>
      schema.validate({ hobbies: ['programming', 'fishing'] })
    ).to.not.throw();

    expect(() => schema.validate({ hobbies: [1, 2] })).to.throw();

    const res = schema.validate({});
    expect(res).to.deep.equal({ hobbies: [] });
  });

  it('virtual() should add a virtual getter to all documents', async () => {
    interface IUser extends Document {
      firstname: string;
      lastname: string;
      name: string;
    }

    const UserSchema = new Schema({
      firstname: String,
      lastname: String,
    });

    UserSchema.virtual('name').get(function () {
      return `${this.firstname} ${this.lastname}`;
    });

    const User = connection.model<IUser>('User', UserSchema);

    const jane = new User({ firstname: 'Jane', lastname: 'Doe' });
    expect(jane.name).to.equal('Jane Doe');
  });

  it('method() should add a custom function to all documents', async () => {
    interface IUser extends Document {
      firstname: string;
      lastname: string;
      name(prefix: string): string;
    }

    const UserSchema = new Schema({
      firstname: String,
      lastname: String,
    });

    UserSchema.method('name', function (prefix: string) {
      return `${prefix}${this.firstname} ${this.lastname}`;
    });

    const User = connection.model<IUser>('User', UserSchema);

    const jane = new User({ firstname: 'Jane', lastname: 'Doe' });
    expect(jane.name('Mrs: ')).to.equal('Mrs: Jane Doe');
  });

  it('static() should add a custom function to the model', async () => {
    interface IUser extends Document {
      name: string;
    }

    interface IUserModel extends Model<IUser> {
      findByName(name: string): Promise<IUser>;
    }

    const UserSchema = new Schema({
      name: String,
    });

    UserSchema.static('findByName', function (name: string) {
      const model = this as Model<any>;
      return model.findOne({ name });
    });

    const User = connection.model<IUser, IUserModel>('User', UserSchema);

    const jane = await User.create({ name: 'Jane Doe' });

    const res = await User.findByName('Jane Doe');
    expect(res.toObject()).to.deep.equal(jane.toObject());
  });
});
