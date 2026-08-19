import { vi } from 'vitest'

// Some FilterView filter modules pull in useLanguage -> redux/auth -> apiConnection, which
// reads window.localStorage at module load time. Stub it so those modules can be imported
// under Vitest's Node test environment.
vi.stubGlobal('window', { localStorage: { getItem: () => null } })
