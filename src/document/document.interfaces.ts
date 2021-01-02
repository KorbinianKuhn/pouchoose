import { Document } from './document.class';

export interface GenericDoc {
  _id: string;
  _rev: string;
  _deleted?: boolean;
  [key: string]: any;
}

export interface GenericDocumentStream {
  change: DocumentChange;
  doc: GenericDoc;
}
export interface DocumentStream<T extends Document> {
  change: DocumentChange;
  doc: T;
}

export type DocumentChange = 'add' | 'update' | 'delete';
