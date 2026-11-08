// @typescript-eslint/unbound-method flags `expect(repo.someMethod).toHaveBeenCalledWith(...)`
// as an unbound method reference -- a real risk for a class instance method that reads `this`,
// but these are jest.fn() mocks with no `this` of their own, so the rule's concern doesn't apply.
/* eslint-disable @typescript-eslint/unbound-method */
import { MAX_NAME_LENGTH } from '../../domain/user';
import type { UserRepository } from '../../domain/user';
import { ResolveCurrentUserUseCase } from './resolve-current-user.use-case';

function makeUserRepo(
  overrides: Partial<jest.Mocked<UserRepository>> = {},
): jest.Mocked<UserRepository> {
  return {
    findByAuthId: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    completeOnboarding: jest.fn(),
    ...overrides,
  };
}

describe('ResolveCurrentUserUseCase', () => {
  it('resolves from the repository on first call (no cache yet) and creates nothing', async () => {
    const userRepo = makeUserRepo({
      findByAuthId: jest.fn().mockResolvedValue({ id: 'user-1' }),
    });
    const useCase = new ResolveCurrentUserUseCase(userRepo);

    const id = await useCase.execute({ externalAuthId: 'auth-1' });

    expect(id).toBe('user-1');
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('serves the second call for the same externalAuthId from the in-memory cache, with no repository call at all', async () => {
    const userRepo = makeUserRepo({
      findByAuthId: jest.fn().mockResolvedValue({ id: 'user-1' }),
    });
    const useCase = new ResolveCurrentUserUseCase(userRepo);

    await useCase.execute({ externalAuthId: 'auth-1' });
    userRepo.findByAuthId.mockClear();
    const id = await useCase.execute({ externalAuthId: 'auth-1' });

    expect(id).toBe('user-1');
    expect(userRepo.findByAuthId).not.toHaveBeenCalled();
  });

  it('provisions a new user when no pointer exists yet', async () => {
    const userRepo = makeUserRepo({
      findByAuthId: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(undefined),
    });
    const useCase = new ResolveCurrentUserUseCase(userRepo);

    const id = await useCase.execute({
      externalAuthId: 'auth-new',
      email: 'player@example.com',
      name: 'Nguyen Van A',
    });

    expect(userRepo.create).toHaveBeenCalledTimes(1);
    const [createdUser] = userRepo.create.mock.calls[0];
    expect(createdUser.toJSON()).toMatchObject({
      externalAuthId: 'auth-new',
      email: 'player@example.com',
      fullName: 'Nguyen Van A',
    });
    expect(id).toBe(createdUser.id);
  });

  it('falls back to the email prefix as the name when no name is supplied (the normal Hosted-UI path)', async () => {
    const userRepo = makeUserRepo({
      findByAuthId: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(undefined),
    });
    const useCase = new ResolveCurrentUserUseCase(userRepo);

    await useCase.execute({ externalAuthId: 'auth-new', email: 'jdoe@example.com' });

    const [createdUser] = userRepo.create.mock.calls[0];
    expect(createdUser.toJSON().fullName).toBe('jdoe');
  });

  it('truncates a derived name to MAX_NAME_LENGTH', async () => {
    const longLocalPart = 'a'.repeat(MAX_NAME_LENGTH + 20);
    const userRepo = makeUserRepo({
      findByAuthId: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(undefined),
    });
    const useCase = new ResolveCurrentUserUseCase(userRepo);

    await useCase.execute({ externalAuthId: 'auth-new', email: `${longLocalPart}@example.com` });

    const [createdUser] = userRepo.create.mock.calls[0];
    expect(createdUser.toJSON().fullName).toHaveLength(MAX_NAME_LENGTH);
  });

  it('throws when provisioning is needed but no email was supplied (misconfiguration, not a race)', async () => {
    const userRepo = makeUserRepo({ findByAuthId: jest.fn().mockResolvedValue(null) });
    const useCase = new ResolveCurrentUserUseCase(userRepo);

    await expect(useCase.execute({ externalAuthId: 'auth-new' })).rejects.toThrow(
      /carries no email/,
    );
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('recovers from a concurrent-create race by re-reading consistently and returning the winner', async () => {
    const winner = { id: 'winner-id' };
    const userRepo = makeUserRepo({
      findByAuthId: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(winner),
      create: jest.fn().mockRejectedValue(new Error('conditional check failed')),
    });
    const useCase = new ResolveCurrentUserUseCase(userRepo);

    const id = await useCase.execute({
      externalAuthId: 'auth-race',
      email: 'player@example.com',
      name: 'Player',
    });

    expect(id).toBe('winner-id');
    expect(userRepo.findByAuthId).toHaveBeenLastCalledWith('auth-race', { consistentRead: true });
  });

  it('rethrows the original create error when the consistent re-read also finds nothing (a real write failure, not a race)', async () => {
    const writeError = new Error('write failed for real');
    const userRepo = makeUserRepo({
      findByAuthId: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
      create: jest.fn().mockRejectedValue(writeError),
    });
    const useCase = new ResolveCurrentUserUseCase(userRepo);

    await expect(
      useCase.execute({ externalAuthId: 'auth-fail', email: 'player@example.com' }),
    ).rejects.toBe(writeError);
  });
});
