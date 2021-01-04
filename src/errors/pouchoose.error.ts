export class PouchooseError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}
