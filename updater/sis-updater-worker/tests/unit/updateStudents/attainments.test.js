import { beforeEach, describe, expect, it, vi } from 'vitest'

// updateAttainments talks directly to knex, Sequelize models, and the db/index.js helpers. This
// establishes the pattern for testing this kind of DB-coupled orchestrator: mock the DB layer at
// its boundary and let the real (pure) mapping logic run on top of canned data.
//
// vi.hoisted is required because vi.mock factories run before the rest of this file, so any mock
// state they reference (and that assertions below need to inspect) has to be created up front.
const { knexMock, bulkCreateMock, selectFromByIdsMock, selectOneByIdMock } = vi.hoisted(() => {
  const makeChainableQuery = result => {
    const builder = {
      select: () => builder,
      from: () => builder,
      where: () => builder,
      whereIn: () => builder,
      then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    }
    return builder
  }

  const tableResults = {
    course_units: [{ id: 'cu1', code: 'TKT10' }],
    modules: [],
  }

  const knexMock = Object.assign(
    vi.fn(table => makeChainableQuery(tableResults[table] ?? [])),
    { select: () => makeChainableQuery([]) }
  )

  return {
    knexMock,
    bulkCreateMock: vi.fn(),
    selectFromByIdsMock: vi.fn().mockResolvedValue([]),
    selectOneByIdMock: vi.fn().mockResolvedValue(null),
  }
})

vi.mock('@/db/connection.js', () => ({ dbConnections: { knex: knexMock } }))

vi.mock('@/db/index.js', () => ({
  selectFromByIds: selectFromByIdsMock,
  selectOneById: selectOneByIdMock,
  bulkCreate: bulkCreateMock,
}))

vi.mock('@/db/models/index.js', () => ({
  Course: { name: 'Course', findOne: vi.fn() },
  Teacher: { name: 'Teacher', findOne: vi.fn() },
  Credit: { name: 'Credit' },
  CreditTeacher: { name: 'CreditTeacher' },
  CourseProvider: { name: 'CourseProvider', findOne: vi.fn() },
}))

vi.mock('@/utils/logger.js', () => ({
  default: { error: vi.fn(), info: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}))

// updateAttainments builds its credit rows via mapper.js's real creditMapper, which in turn reads
// from shared.js's Redis-backed lookup maps - mocked here the same way as in mapper.test.js.
vi.mock('@/updater/shared.js', () => ({
  getSemesterByDate: vi.fn(() => ({ semestercode: 100, composite: '2020-2021-fall' })),
  getGrade: vi.fn(() => ({ value: '5', passed: true })),
  getUniOrgId: vi.fn(() => 'uni-org1'),
  getCountry: vi.fn(),
  getCreditTypeCodeFromAttainment: vi.fn(() => 'PASSED'),
  educationTypeToExtentcode: {},
}))

import { Course } from '@/db/models/index.js'
import { updateAttainments } from '@/updater/updateStudents/attainments.js'

describe('updateAttainments', () => {
  beforeEach(() => {
    bulkCreateMock.mockClear()
  })

  /** Get what calls were directed to the wanted model by bulkCreate */
  const findBulkCreateCall = modelName => bulkCreateMock.mock.calls.find(([model]) => model.name === modelName)

  it('maps a plain course unit attainment into a Credit bulkCreate call', async () => {
    const attainment = {
      id: 'att1',
      type: 'CourseUnitAttainment',
      misregistration: false,
      credits: 5,
      person_id: 'p1',
      registration_date: '2020-01-10',
      grade_scale_id: 'scale1',
      grade_id: 'grade1',
      organisations: [{ organisationId: 'org1', roleUrn: 'urn:code:organisation-role:responsible-organisation' }],
      attainment_date: '2020-01-15',
      course_unit_id: 'cu1',
      module_id: null,
      module_group_id: null,
      study_right_id: null,
      attainment_language_urn: 'urn:code:language:fi',
      acceptor_persons: [],
    }

    await updateAttainments([attainment], { p1: '014123456' }, new Set(), {})

    const [, credits] = findBulkCreateCall('Credit')
    expect(credits).toHaveLength(1)
    expect(credits[0]).toMatchObject({
      id: 'att1',
      student_studentnumber: '014123456',
      course_id: 'cu1',
      course_code: 'TKT10',
      credits: 5,
      is_open: false,
    })

    // No custom-attainment repairs or acceptor persons were involved, so these come back empty.
    expect(findBulkCreateCall('Teacher')[1]).toEqual([])
    expect(findBulkCreateCall('Course')[1]).toEqual([])
    expect(findBulkCreateCall('CreditTeacher')[1]).toEqual([])
    expect(findBulkCreateCall('CourseProvider')[1]).toEqual([])
  })

  it('creates new custom course unit from an attainment', async () => {
    const attainment = {
      id: 'att-custom-1',
      type: 'CustomCourseUnitAttainment',
      code: 'XYZ-123',
      misregistration: false,
      credits: 5,
      person_id: 'p1',
      registration_date: '2020-01-10',
      grade_scale_id: 'scale1',
      grade_id: 'grade1',
      organisations: [{ organisationId: 'org1', roleUrn: 'urn:code:organisation-role:responsible-organisation' }],
      attainment_date: '2020-01-15',
      course_unit_id: null,
      module_id: null,
      module_group_id: null,
      study_right_id: null,
      attainment_language_urn: 'urn:code:language:fi',
      acceptor_persons: [],
      name: { fi: 'Testikurssi' },
      study_level_urn: 'lvl1',
      course_unit_type_urn: 'type1',
    }

    await updateAttainments([attainment], { p1: '014123456' }, new Set(), {})

    const [, courses] = findBulkCreateCall('Course')
    expect(courses).toHaveLength(1)
    expect(courses[0].groupId).toBe(courses[0].id)
  })

  it('updates custom course unit with fields from a new attainment', async () => {
    Course.findOne.mockResolvedValueOnce({
      id: 'XYZ-123',
      groupId: null, // Group id missing
      code: 'XYZ-123',
      name: { fi: 'Vanha nimi' }, // Incorrect name
      isStudyModule: false,
      isPrimary: true,
      coursetypecode: 'lvl1',
      maxAttainmentDate: '2019-06-01',
      minAttainmentDate: '2019-01-01',
      substitutionGroups: [],
      courseUnitType: 'type1',
    })

    const attainment = {
      id: 'att-custom-2',
      type: 'CustomCourseUnitAttainment',
      code: 'XYZ-123',
      misregistration: false,
      credits: 5,
      person_id: 'p1',
      registration_date: '2020-01-10',
      grade_scale_id: 'scale1',
      grade_id: 'grade1',
      organisations: [{ organisationId: 'org1', roleUrn: 'urn:code:organisation-role:responsible-organisation' }],
      attainment_date: '2020-01-15',
      course_unit_id: null,
      module_id: null,
      module_group_id: null,
      study_right_id: null,
      attainment_language_urn: 'urn:code:language:fi',
      acceptor_persons: [],
      name: { fi: 'Uusi nimi' },
      study_level_urn: 'lvl1',
      course_unit_type_urn: 'type1',
    }

    await updateAttainments([attainment], { p1: '014123456' }, new Set(), {})

    const [, courses] = findBulkCreateCall('Course')
    expect(courses).toHaveLength(1)
    expect(courses[0].id).toBe('XYZ-123')
    expect(courses[0].groupId).toBe('XYZ-123')
    expect(courses[0].name.fi).toBe('Uusi nimi')
    expect(courses[0].maxAttainmentDate).toBe('2020-01-15')
    expect(courses[0].minAttainmentDate).toBe('2019-01-01')
  })
})
