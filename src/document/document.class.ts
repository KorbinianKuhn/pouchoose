import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Model } from '../model/model.interfaces';
import { DocumentStream, LeanDocument } from './document.interfaces';
export class Document {
  public $type: string;
  public _id: string;
  public _rev: string;
  public _deleted: boolean;

  constructor(doc: any, private model: Model<any>) {
    Object.assign(this, doc);

    if (model) {
      for (const virtual of model.schema.virtuals) {
        Object.defineProperty(this, virtual.name, {
          get: virtual._getter,
        });
      }

      for (const [name, fn] of Object.entries(model.schema.methods)) {
        this[name] = fn;
      }
    }
  }

  public toObject<T extends Document = any>(): LeanDocument<T> {
    const obj: any = {};

    const keys = Object.keys(this).filter(
      (key) => !(this[key] instanceof Function)
    );

    for (const key of keys) {
      obj[key] = this[key];
    }
    return obj;
  }

  public version(): number {
    return this._rev ? parseInt(this._rev[0]) : 0;
  }

  public get(path: string): any {
    try {
      return path.split('.').reduce((a: any, v: string) => a[v], this);
    } catch (err) {
      throw new Error(`Invalid path: ${path}`);
    }
  }

  public set(path: string, value: unknown): void {
    try {
      const elements = path.split('.');
      const last = elements.pop();
      let obj = this;

      for (const element of elements) {
        obj = obj[element];
      }

      obj[last] = value;
    } catch (err) {
      throw new Error(`Invalid path: ${path}`);
    }
  }

  public unset(path: string): void {
    try {
      const elements = path.split('.');
      const last = elements.pop();
      let obj = this;

      for (const element of elements) {
        obj = obj[element];
      }

      delete obj[last];
    } catch (err) {
      throw new Error(`Invalid path: ${path}`);
    }
  }

  public async save(): Promise<this> {
    const doc = this._id
      ? await (this.model as Model<this>).findByIdAndUpdate(this._id, {
          $set: this.toObject(),
        })
      : await (this.model as Model<this>).create(this.toObject());

    Object.assign(this, doc.toObject());

    return this;
  }

  public async delete(): Promise<this> {
    if (this._id) {
      const doc = await (this.model as Model<this>).findByIdAndDelete(this._id);

      Object.assign(this, doc.toObject());
    } else {
      this._deleted = true;
    }
    return this;
  }

  public watch(): Observable<DocumentStream<this>> {
    return this.model.watch().pipe(filter((o) => o.doc._id === this._id));
  }
}
