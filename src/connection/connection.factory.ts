import { Connection } from './connection.class';
import { DEFAULT_CONNECTION } from './connection.constants';

export const connect = async (
  name: string,
  options?: PouchDB.Configuration.DatabaseConfiguration
): Promise<Connection> => {
  const connection =
    DEFAULT_CONNECTION.name === undefined || DEFAULT_CONNECTION.name === name
      ? DEFAULT_CONNECTION
      : new Connection();

  connection.configure(name, options);

  await connection.reconnect();

  return connection;
};
