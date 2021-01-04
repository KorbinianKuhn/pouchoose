import * as PouchDB from 'pouchdb';
import * as PouchDBMemory from 'pouchdb-adapter-memory';
import { connect, Connection } from '../src/public_api';

PouchDB.plugin(PouchDBMemory);

let connection: Connection;

export const beforeEachOperations = async (): Promise<Connection> => {
  if (connection) {
    connection.encrypt = null;
    connection.decrypt = null;

    connection.deleteModel(/./);
    await connection.dropDatabase();
    await connection.reconnect();
  } else {
    connection = await connect('test', {
      adapter: 'memory',
    });
  }

  return connection;
};
