import { Email } from './email.value-object';
import { InvalidEmailError } from '../errors';

describe('Email.create', () => {
  it('accepts a well-formed address and lowercases it', () => {
    const email = Email.create('Player@Example.COM');
    expect(email.email).toBe('player@example.com');
  });

  it('accepts an address that already has mixed-case preserved only by lowercasing', () => {
    const email = Email.create('a.b+tag@sub.example.co');
    expect(email.email).toBe('a.b+tag@sub.example.co');
  });

  it.each(['no-at-sign.com', 'missing-domain@', '@missing-local.com', 'spaces in@email.com', ''])(
    'rejects malformed address %p',
    (value) => {
      expect(() => Email.create(value)).toThrow(InvalidEmailError);
    },
  );
});
