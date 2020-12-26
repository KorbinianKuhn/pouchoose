import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Model } from '../model/model.class';
export class Document {
  public $type: string;
  public _id: string;
  public _rev: string;
  public _deleted: boolean;

  constructor(doc: any, private model: Model<any>) {
    Object.assign(this, doc);
  }

  toJSON(): any {
    const obj: any = {};

    const keys = Object.keys(this).filter((key) => !['model'].includes(key));

    for (const key of keys) {
      obj[key] = this[key];
    }
    return obj;
  }

  set(path: string, value: unknown): void {
    this[path] = value;
  }

  async save(): Promise<this> {
    const doc = this._id
      ? await this.model.findByIdAndUpdate(this._id, this.toJSON())
      : await this.model.create(this.toJSON());

    Object.assign(this, doc);

    return this;
  }

  async delete(): Promise<this> {
    if (this._id) {
      const doc = await this.model.findByIdAndDelete(this._id);

      Object.assign(this, doc);
    } else {
      this._deleted = true;
    }
    return this;
  }

  getObservable(): Observable<this> {
    return this.model.changed.pipe<this>(filter((o) => o._id === this._id));
  }
}
