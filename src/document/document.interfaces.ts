import { Document } from './document.class';

export interface BaseDoc {
  _id: string;
  _rev: string;
  _deleted?: boolean;
}
export interface GenericDoc extends BaseDoc {
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

export type LeanDocument<T> = Omit<T, keyof Document> & BaseDoc;
