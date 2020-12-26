export class ValidationError extends Error {
  constructor(message: string, value: any) {
    super(message);
  }
}
