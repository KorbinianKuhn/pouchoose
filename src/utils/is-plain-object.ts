function isObject(value: any): boolean {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function isPlainObject(value: any): boolean {
  if (isObject(value) === false) {
    return false;
  }

  const ctor = value.constructor;
  if (ctor === undefined) {
    return true;
  }

  const prot = ctor.prototype;
  if (isObject(prot) === false) {
    return false;
  }

  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false;
  }

  return true;
}
