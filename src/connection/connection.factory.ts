import { Connection } from './connection.class';

export const createConnection = async (
  name: string,
  options?: PouchDB.Configuration.DatabaseConfiguration
) => {
  const connection = new Connection();

  connection.configure(name, options);

  await connection.reconnect();

  return connection;
};
