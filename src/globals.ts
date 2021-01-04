import { Connection } from './connection/connection.class';
import { Document } from './document/document.class';
import { PouchooseError } from './errors/pouchoose.error';
import { Model } from './model/model.interfaces';
import { Schema } from './schema/schema.class';

export const connection = new Connection();

/**
 * Defines a model or retrieves it.
 * Models defined on the pouchoose instance are available to all connection created by the same pouchoose instance.
 */
export const model = <T extends Document = any, U extends Model<T> = Model<T>>(
  name: string,
  schema: Schema
): U => connection.model<T, U>(name, schema);

export const connect = async (
  name: string,
  options?: PouchDB.Configuration.DatabaseConfiguration
): Promise<Connection> => {
  if (connection.name !== undefined) {
    throw new PouchooseError(
      'Default connection is already created',
      'CANNOT_RECREATE_DEFAULT_CONNECTION'
    );
  }

  connection.configure(name, options);

  await connection.reconnect();

  return connection;
};
