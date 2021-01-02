import { Connection } from '../connection/connection.class';

export class SyncHandler {
  private activeLiveSync: PouchDB.Replication.Sync<any>;

  constructor(private connection: Connection, private db: PouchDB.Database) {}

  async start(
    mode: 'once' | 'live',
    options: PouchDB.Replication.SyncOptions = {}
  ): Promise<void> {
    switch (mode) {
      case 'live': {
        if (this.activeLiveSync) {
          throw new Error('Stop current live sync first');
        }
        this.activeLiveSync = this.connection.db.sync(this.db, {
          ...options,
          live: true,
          retry: true,
        });
        return Promise.resolve();
      }
      case 'once': {
        return new Promise((resolve, reject) => {
          const syncHandler = this.connection.db
            .sync(this.db, options)
            .on('denied', (err) => {
              reject(err);
            })
            .on('error', (err: any) => {
              reject(err);
            })
            .on('complete', () => {
              syncHandler.cancel();
              resolve();
            });
        });
      }
    }
  }

  async stop(): Promise<void> {
    if (this.activeLiveSync) {
      const promise = new Promise<void>((resolve) => {
        this.activeLiveSync.on('complete', () => {
          delete this.activeLiveSync;
          resolve();
        });
      });
      this.activeLiveSync.cancel();
      return promise;
    }
  }
}
