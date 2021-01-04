import { expect } from 'chai';
import { Model } from '../src/model/model.interfaces';
import { Connection, Document, Schema } from '../src/public_api';
import { beforeEachOperations } from './utils';

interface IUser extends Document {
  name: string;
  comments: string[];
}

const UserSchema = new Schema({
  name: String,
  comments: [
    {
      type: String,
      ref: 'Comment',
    },
  ],
});

interface IComment extends Document {
  user: string;
  message: string;
}

const CommentSchema = new Schema({
  user: {
    type: String,
    ref: 'User',
  },
  message: String,
});

let connection: Connection;
let User: Model<IUser>;
let Comment: Model<IComment>;

beforeEach(async () => {
  connection = await beforeEachOperations();
  User = connection.model<IUser>('User', UserSchema);
  Comment = connection.model<IComment>('Comment', CommentSchema);
});

describe('Model', async () => {
  it.skip('populate() should work correctly', async () => {
    // Setup
    const jane = await User.create({ name: 'Jane Doe' });
    const comments = await Comment.insertMany([
      {
        user: jane._id,
        message: 'Comment A',
      },
      {
        user: jane._id,
        message: 'Comment B',
      },
    ]);

    jane.comments = comments.map((o) => o._id);
    await jane.save();

    // Populate queries
    const populatedUser = await User.findById(jane._id).populate('comments');
    expect(populatedUser.toObject()).to.deep.equal({
      ...jane.toObject(),
      comments: comments.map((o) => o.toObject()),
    });

    const populatedComments = await Comment.find().populate('user');
    expect(populatedComments.map((o) => o.toObject())).to.deep.equal(
      comments.map((o) => ({
        ...o.toObject(),
        user: jane.toObject(),
      }))
    );
  });
});
