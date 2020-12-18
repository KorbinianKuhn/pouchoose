interface QueryFInterface {
  skip(test: string): QueryFInterface;
}

function QueryF(
  query: QueryConditions,
  connection: Connection,
  schema: Schema
): QueryFInterface {
  const pipeline: any[] = [];

  this.skip = (test: string) => {};

  return this;
}

QueryF.prototype.skip = function () {
  return this;
};

QueryF.prototype.then = function (resolve, reject) {
  return this.exec().then(resolve, reject);
};

const test = QueryF(null, null, null);
