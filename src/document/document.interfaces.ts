export interface GenericDoc {
  _id: string;
  _rev: string;
  _deleted?: boolean;
  [key: string]: any;
}
