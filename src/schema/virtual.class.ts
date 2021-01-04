export class VirtualType {
  public _getter: () => any;

  constructor(public name: string) {}

  get(fn: () => any): void {
    this._getter = fn;
  }
}
