export enum DocumentChangeType {
  ADD = 'add',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum ReadyState {
  DISCONNECTED,
  CONNECTED,
  CONNECTING,
  DISCONNECTING,
}
