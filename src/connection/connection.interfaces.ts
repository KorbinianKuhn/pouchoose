import { GenericDoc } from './../document/document.interfaces';

export type EncryptionCallback = (docs: GenericDoc[]) => Promise<GenericDoc[]>;
export type DecryptionCallback = (docs: GenericDoc[]) => Promise<GenericDoc[]>;

export type ConnectionEvent = 'change' | 'error';
