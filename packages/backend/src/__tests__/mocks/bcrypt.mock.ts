import { vi } from 'vitest';

export const mockBcrypt = {
  hash: vi.fn((password: string, rounds: number) =>
    Promise.resolve(`hashed_${password}_${rounds}`)
  ),
  compare: vi.fn((password: string, hash: string) => {
    if (hash.includes(password)) {
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }),
  genSalt: vi.fn((rounds: number) => Promise.resolve(`salt_${rounds}`)),
};

export function resetBcryptMocks() {
  mockBcrypt.hash.mockReset();
  mockBcrypt.compare.mockReset();
  mockBcrypt.genSalt.mockReset();

  mockBcrypt.hash.mockImplementation((password: string, rounds: number) =>
    Promise.resolve(`hashed_${password}_${rounds}`)
  );
  mockBcrypt.compare.mockImplementation((password: string, hash: string) =>
    Promise.resolve(hash.includes(password))
  );
}
