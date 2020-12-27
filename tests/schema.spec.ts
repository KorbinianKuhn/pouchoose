import { expect } from 'chai';
import { Schema } from '../src/public_api';

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
});
