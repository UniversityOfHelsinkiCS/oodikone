export const createStudyRightElementModel = (overrides: Partial<Record<string, unknown>> = {}) => ({
  studyRightId: 'sr-1',
  code: 'KH50_005',
  name: { en: 'Bachelor', fi: 'Kandi', sv: 'Kandi sv' },
  startDate: new Date(2019, 0, 1),
  endDate: new Date(2025, 0, 1),
  studyRight: { facultyCode: 'H50', organization: { name: { en: 'Faculty', fi: 'Tiedekunta', sv: 'Fakultet' } } },
  ...overrides,
})
