import { vi } from 'vitest'

// mapper.js imports logger.js and shared.js at module load time. shared.js transitively
// connects to Redis and instantiates Sequelize models as a side effect of being imported, so both
// are mocked here to keep these unit tests pure and fast.
//
// NOTE: Import this module first - before importing anything from mapper.js - in every test file in
// this directory. Tests that need per-case control over a shared.js lookup (e.g. creditMapper,
// enrollmentMapper) can still `import { getSemesterByDate, ... } from '.../updater/shared.js'`
// afterwards and call `.mockReturnValue(...)` on it - it's the same mocked function instance.
vi.mock('@/utils/logger.js', () => ({
  default: { error: vi.fn(), info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}))

vi.mock('@/updater/shared.js', () => ({
  getSemesterByDate: vi.fn(),
  getGrade: vi.fn(),
  getUniOrgId: vi.fn(),
  getCountry: vi.fn(),
  getCreditTypeCodeFromAttainment: vi.fn(),
  educationTypeToExtentcode: { 'edu-type-1': 1 },
}))
