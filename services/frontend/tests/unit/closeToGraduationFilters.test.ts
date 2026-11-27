import { assert, describe, it } from 'vitest'

import type { GetTextIn } from '@/components/LanguagePicker/useLanguage'
import { toExportRows } from '@/pages/CloseToGraduation/excelExport'
import {
  describeFilters,
  emptyFilters,
  filterStudents,
  getFilterOptions,
  pruneFilters,
  type FilterOption,
} from '@/pages/CloseToGraduation/filters'
import type { CloseToGraduationData } from '@oodikone/shared/routes/populations'
import { DegreeProgrammeType, EnrollmentType, type Name } from '@oodikone/shared/types'

const getTextInLanguage = (language: 'fi' | 'en') =>
  ((text: Name | string | null | undefined, lang?: string) =>
    typeof text === 'string' ? text : (text?.[lang ?? language] ?? text?.fi ?? null)) as GetTextIn

const getTextIn = getTextInLanguage('fi')

type CodeAndName = { code: string; name: string }

const LAW: CodeAndName = { code: 'H20', name: 'Oikeustieteellinen tiedekunta' }
const SCIENCE: CodeAndName = { code: 'H50', name: 'Matemaattis-luonnontieteellinen tiedekunta' }
const MATHEMATICS: CodeAndName = { code: 'MAT-ST', name: 'Matematiikka' }
const STATISTICS: CodeAndName = { code: 'TIL-ST', name: 'Tilastotiede' }
const SOFTWARE: CodeAndName = { code: 'OHJ-ST', name: 'Ohjelmistot' }

const createStudent = ({
  studentNumber,
  faculty,
  programmeCode,
  programmeName,
  studyTrack = null,
  curriculumPeriod = '2023-2026',
  preferredLanguage = 'fi',
  isBaMa = false,
  thesisCompleted = false,
}: {
  studentNumber: string
  faculty: CodeAndName
  programmeCode: string
  programmeName: string
  studyTrack?: CodeAndName | null
  curriculumPeriod?: string | null
  preferredLanguage?: string
  isBaMa?: boolean
  thesisCompleted?: boolean
}): CloseToGraduationData => ({
  student: {
    studentNumber,
    name: `Student ${studentNumber}`,
    sis_person_id: `hy-hlo-${studentNumber}`,
    email: `${studentNumber}@example.com`,
    phoneNumber: '',
    secondaryEmail: '',
    preferredLanguage,
  },
  studyright: {
    startDate: new Date('2021-08-01'),
    semesterEnrollments: [{ type: EnrollmentType.PRESENT, semester: 143 }],
    isBaMa,
  },
  thesisInfo: thesisCompleted ? { grade: '5', attainmentDate: new Date('2024-05-15'), courseCode: 'THESIS-1' } : null,
  programme: {
    code: programmeCode,
    name: { fi: programmeName },
    studyTrack: studyTrack ? { code: studyTrack.code, name: { fi: studyTrack.name } } : null,
    startedAt: new Date('2021-08-01'),
    degreeProgrammeType: DegreeProgrammeType.BACHELOR,
  },
  faculty: { code: faculty.code, name: { fi: faculty.name } },
  attainmentDates: { latestTotal: new Date('2024-05-15') },
  numberOfAbsentSemesters: 0,
  numberOfUsedSemesters: 6,
  curriculumPeriod,
  credits: { hops: 170, all: 175 },
})

const students = [
  createStudent({
    studentNumber: '1',
    faculty: LAW,
    programmeCode: 'KH20_001',
    programmeName: 'Oikeusnotaarin koulutusohjelma',
    isBaMa: true,
  }),
  createStudent({
    studentNumber: '2',
    faculty: SCIENCE,
    programmeCode: 'KH50_001',
    programmeName: 'Matemaattisten tieteiden kandiohjelma',
    studyTrack: MATHEMATICS,
    thesisCompleted: true,
  }),
  createStudent({
    studentNumber: '3',
    faculty: SCIENCE,
    programmeCode: 'KH50_005',
    programmeName: 'Tietojenkäsittelytieteen kandiohjelma',
    curriculumPeriod: '2020-2023',
    preferredLanguage: 'en',
  }),
]

const studentNumbersOf = (rows: CloseToGraduationData[]) => rows.map(row => row.student.studentNumber)

void describe('filterStudents', () => {
  void it('returns every student when no filter is set', () => {
    assert.deepEqual(studentNumbersOf(filterStudents(students, emptyFilters)), ['1', '2', '3'])
  })

  void it('filters by faculty code', () => {
    const filters = { ...emptyFilters, faculties: [SCIENCE.code] }
    assert.deepEqual(studentNumbersOf(filterStudents(students, filters)), ['2', '3'])
  })

  void it('filters by programme code', () => {
    assert.deepEqual(studentNumbersOf(filterStudents(students, { ...emptyFilters, programmes: ['KH50_005'] })), ['3'])
  })

  void it('filters by the yes/no toggles', () => {
    assert.deepEqual(studentNumbersOf(filterStudents(students, { ...emptyFilters, isBaMa: true })), ['1'])
    assert.deepEqual(studentNumbersOf(filterStudents(students, { ...emptyFilters, thesisCompleted: false })), [
      '1',
      '3',
    ])
  })

  void it('combines filters', () => {
    const filters = {
      ...emptyFilters,
      faculties: [SCIENCE.code],
      thesisCompleted: false,
    }
    assert.deepEqual(studentNumbersOf(filterStudents(students, filters)), ['3'])
  })
})

void describe('getFilterOptions', () => {
  void it('narrows programme options by the selected faculties', () => {
    const options = getFilterOptions(
      students,
      { ...emptyFilters, faculties: [SCIENCE.code], programmes: ['KH50_001'] },
      getTextIn
    )
    assert.deepEqual(options.faculties.length, 2)
    assert.deepEqual(
      options.programmes.map(option => option.value),
      ['KH50_001', 'KH50_005']
    )
  })

  const countsOf = (options: FilterOption[]) => options.map(({ value, count }) => [value, count])

  void it('counts students per option when no filter is set', () => {
    const options = getFilterOptions(students, emptyFilters, getTextIn)
    assert.deepEqual(countsOf(options.faculties), [
      [SCIENCE.code, 2],
      [LAW.code, 1],
    ])
    assert.deepEqual(countsOf(options.programmes), [
      ['KH50_001', 1],
      ['KH20_001', 1],
      ['KH50_005', 1],
    ])
  })

  void it('ignores the filter’s own selection when counting its options', () => {
    const options = getFilterOptions(students, { ...emptyFilters, faculties: [LAW.code] }, getTextIn)
    assert.deepEqual(countsOf(options.faculties), [
      [SCIENCE.code, 2],
      [LAW.code, 1],
    ])
    assert.deepEqual(countsOf(options.programmes), [['KH20_001', 1]])
  })

  void it('applies the other filters to the counts and keeps options that drop to zero', () => {
    const options = getFilterOptions(students, { ...emptyFilters, thesisCompleted: true }, getTextIn)
    assert.deepEqual(countsOf(options.faculties), [
      [SCIENCE.code, 1],
      [LAW.code, 0],
    ])
  })
})

void describe('pruneFilters', () => {
  void it('drops programmes outside the selected faculties', () => {
    const filters = {
      ...emptyFilters,
      faculties: [LAW.code],
      programmes: ['KH50_001', 'KH20_001'],
    }
    const pruned = pruneFilters(students, filters, getTextIn)
    assert.deepEqual(pruned.programmes, ['KH20_001'])
    assert.deepEqual(pruned.faculties, [LAW.code])
  })
})

void describe('faculty selections across languages', () => {
  const lawStudent = { ...students[0], faculty: { code: LAW.code, name: { fi: LAW.name, en: 'Faculty of Law' } } }
  const filters = { ...emptyFilters, faculties: [LAW.code] }

  void it('keeps a selected faculty active and labels it in the current language', () => {
    const inEnglish = getTextInLanguage('en')
    assert.deepEqual(studentNumbersOf(filterStudents([lawStudent], filters)), ['1'])
    assert.deepEqual(getFilterOptions([lawStudent], filters, inEnglish).faculties, [
      { text: 'Faculty of Law', value: LAW.code, count: 1 },
    ])
  })
})

void describe('describeFilters', () => {
  void it('describes unfiltered data as covering everything', () => {
    const descriptions = describeFilters(emptyFilters, getFilterOptions(students, emptyFilters, getTextIn))
    assert.deepInclude(descriptions, { label: 'Faculty', value: 'all faculties' })
    assert.deepInclude(descriptions, { label: 'Programme', value: 'all programmes' })
    assert.deepInclude(descriptions, { label: 'Thesis completed', value: 'all students' })
  })

  void it('lists selected values by name', () => {
    const filters = {
      ...emptyFilters,
      faculties: [SCIENCE.code],
      programmes: ['KH50_001', 'KH50_005'],
      isBaMa: false,
    }
    const descriptions = describeFilters(filters, getFilterOptions(students, filters, getTextIn))
    assert.deepInclude(descriptions, { label: 'Faculty', value: SCIENCE.name })
    assert.deepInclude(descriptions, {
      label: 'Programme',
      value: 'Matemaattisten tieteiden kandiohjelma, Tietojenkäsittelytieteen kandiohjelma',
    })
    assert.deepInclude(descriptions, {
      label: 'BSc & MSc study right',
      value: 'only students without a combined study right',
    })
  })
})

void describe('study track filter', () => {
  const statisticsStudent = createStudent({
    studentNumber: '4',
    faculty: SCIENCE,
    programmeCode: 'KH50_001',
    programmeName: 'Matemaattisten tieteiden kandiohjelma',
    studyTrack: STATISTICS,
  })
  const computerScienceStudent = createStudent({
    studentNumber: '5',
    faculty: SCIENCE,
    programmeCode: 'KH50_005',
    programmeName: 'Tietojenkäsittelytieteen kandiohjelma',
    studyTrack: SOFTWARE,
  })
  const rows = [...students, statisticsStudent, computerScienceStudent]
  const studyTrackValues = (options: FilterOption[]) => options.map(option => option.value)

  void it('filters by study track code', () => {
    const filters = { ...emptyFilters, studyTracks: [STATISTICS.code] }
    assert.deepEqual(studentNumbersOf(filterStudents(rows, filters)), ['4'])
  })

  void it('offers only study tracks of the selected programmes and skips students without one', () => {
    assert.deepEqual(studyTrackValues(getFilterOptions(rows, emptyFilters, getTextIn).studyTracks), [
      MATHEMATICS.code,
      SOFTWARE.code,
      STATISTICS.code,
    ])
    const filters = { ...emptyFilters, programmes: ['KH50_001'] }
    assert.deepEqual(studyTrackValues(getFilterOptions(rows, filters, getTextIn).studyTracks), [
      MATHEMATICS.code,
      STATISTICS.code,
    ])
  })

  void it('drops study tracks outside the selected programmes', () => {
    const filters = { ...emptyFilters, programmes: ['KH50_005'], studyTracks: [STATISTICS.code, SOFTWARE.code] }
    assert.deepEqual(pruneFilters(rows, filters, getTextIn).studyTracks, [SOFTWARE.code])
  })

  void it('drops study tracks of programmes pruned by the faculty selection', () => {
    const filters = {
      ...emptyFilters,
      faculties: [LAW.code],
      programmes: ['KH50_001'],
      studyTracks: [STATISTICS.code],
    }
    const pruned = pruneFilters(rows, filters, getTextIn)
    assert.deepEqual(pruned.programmes, [])
    assert.deepEqual(pruned.studyTracks, [])
  })

  void it('describes the study track selection', () => {
    const unfiltered = describeFilters(emptyFilters, getFilterOptions(rows, emptyFilters, getTextIn))
    assert.deepInclude(unfiltered, { label: 'Study track', value: 'all study tracks' })

    const byProgramme = { ...emptyFilters, programmes: ['KH50_001'] }
    assert.deepInclude(describeFilters(byProgramme, getFilterOptions(rows, byProgramme, getTextIn)), {
      label: 'Study track',
      value: 'all study tracks of the selected programmes',
    })

    const byStudyTrack = { ...emptyFilters, studyTracks: [MATHEMATICS.code, STATISTICS.code] }
    assert.deepInclude(describeFilters(byStudyTrack, getFilterOptions(rows, byStudyTrack, getTextIn)), {
      label: 'Study track',
      value: `${MATHEMATICS.name}, ${STATISTICS.name}`,
    })
  })
})

void describe('toExportRows', () => {
  void it('flattens a student into readable export columns with enrollment statuses', () => {
    const semesters = {
      '143': { semestercode: 143, name: { fi: 'Syksy 2021' } },
      '144': { semestercode: 144, name: { fi: 'Kevät 2022' } },
    } as unknown as Parameters<typeof toExportRows>[2]
    const [row] = toExportRows([students[1]], getTextIn, semesters, [143, 144])

    assert.equal(row['Student number'], '2')
    assert.equal(row.Faculty, SCIENCE.name)
    assert.equal(row['Study track'], MATHEMATICS.name)
    assert.equal(row['Preferred language'], 'Finnish')
    assert.equal(row['Thesis completed'], 'Yes')
    assert.equal(row['Thesis attainment date'], '2024-05-15')
    assert.equal(row['Enrollment status – Syksy 2021'], 'Present')
    assert.equal(row['Enrollment status – Kevät 2022'], 'No study right')
  })
})
