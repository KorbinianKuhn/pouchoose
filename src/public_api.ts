import { Connection } from './connection/connection.class';
import { createConnection } from './connection/connection.factory';
import { Document } from './document/document.class';
import { GenericDoc } from './document/document.interfaces';
import { connect, model } from './globals';
import { Model } from './model/model.interfaces';
import { Schema } from './schema/schema.class';
import { SyncHandler } from './sync-handler/sync-handler.class';

export {
  model,
  Model,
  connect,
  createConnection,
  Schema,
  Document,
  Connection,
  GenericDoc,
  SyncHandler,
};
