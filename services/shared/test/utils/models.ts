import type { SISStudyRightElementModel } from '../../../backend/src/models'
import type { SISStudyRightElement } from '../../models'

export const createStudyRightElementModel = (overrides: Partial<SISStudyRightElement> = {}) =>
  ({
    studyRightId: 'sr-1',
    code: 'KH50_005',
    name: { en: 'Bachelor', fi: 'Kandi', sv: 'Kandi sv' },
    startDate: new Date(2019, 0, 1),
    endDate: new Date(2025, 0, 1),
    studyRight: {
      facultyCode: 'H50',
      organization: { name: { en: 'Faculty', fi: 'Tiedekunta', sv: 'Fakultet' } },
    } as Partial<SISStudyRightElement['studyRight']>,
    ...overrides,
  }) as SISStudyRightElementModel
