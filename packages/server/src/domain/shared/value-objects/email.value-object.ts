import { InvalidEmailError } from '../errors';

export class Email {
  private constructor(public readonly email: string) {}

  static create(email: string): Email {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regex.test(email)) {
      throw new InvalidEmailError();
    }

    return new Email(email.toLowerCase());
  }
}
