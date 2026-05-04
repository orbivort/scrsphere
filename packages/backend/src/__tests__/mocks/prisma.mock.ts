import { vi } from 'vitest';
import { createMockPrismaClient } from '../setup/testSetup';

export const mockPrisma: ReturnType<typeof createMockPrismaClient> = createMockPrismaClient();

export function resetPrismaMocks() {
  Object.values(mockPrisma).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((method) => {
        if (vi.isMockFunction(method)) {
          method.mockReset();
        }
      });
    }
  });
}
