import { Connection } from './connection.class';

let DEFAULT_CONNECTION: Connection;

export const setDefaultConnection = (connection: Connection) => {
  DEFAULT_CONNECTION = connection;
};

export const getDefaultConnection = (): Connection => {
  return DEFAULT_CONNECTION;
};
