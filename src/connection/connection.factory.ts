import { Connection } from './connection.class';
import {
  getDefaultConnection,
  setDefaultConnection,
} from './connection.constants';

export const connect = async (
  name: string,
  options?: PouchDB.Configuration.DatabaseConfiguration
): Promise<Connection> => {
  const connection = new Connection(name, options);

  if (!getDefaultConnection()) {
    setDefaultConnection(connection);
  }

  return connection;
};
