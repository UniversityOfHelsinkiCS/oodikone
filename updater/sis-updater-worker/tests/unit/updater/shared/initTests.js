import { vi } from 'vitest'

// shared.js connects to Redis and loads every Sequelize model as a side effect of being imported.
// Mock those three dependencies so importing its pure exports doesn't require a live Redis/DB.
//
// Import this module first - before importing anything from shared.js - in every test file in
// this directory.
vi.mock('@/utils/redis.js', () => ({
  redisClient: { get: vi.fn(), set: vi.fn(), connect: vi.fn(), on: vi.fn() },
  lock: vi.fn(),
}))

vi.mock('@/db/index.js', () => ({
  selectAllFrom: vi.fn(),
  selectAllFromSnapshots: vi.fn(),
}))

vi.mock('@/db/models/index.js', () => ({
  Semester: {},
  Organization: {},
  CREDIT_TYPE_CODES: { PASSED: 4, FAILED: 10, IMPROVED: 7, APPROVED: 9 },
}))
