export class Document {
  public $type: string;
  public _id: string;
  public _rev: string;
  public _deleted: boolean;

  constructor(doc: any) {
    Object.assign(this, doc);
  }

  toJSON(): any {
    const obj: any = {};
    for (const key of Object.keys(this)) {
      obj[key] = this[key];
    }
    return obj;
  }

  set(path: string, value: any) {
    this[path] = value;
  }

  async save(): Promise<this> {
    return this;
  }

  async delete(): Promise<this> {
    return this;
  }
}
