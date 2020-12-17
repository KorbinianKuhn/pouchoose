export class Document<T = unknown> {
  public $type: string;

  constructor(doc: any) {
    Object.assign(this, doc);
  }

  set(path: string, value: any) {
    this[path] = value;
  }

  async save(): Promise<Document<T>> {
    return this;
  }

  async delete(): Promise<void> {}
}
