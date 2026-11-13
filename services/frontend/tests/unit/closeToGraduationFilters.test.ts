import { assert, describe, it } from 'vitest'

import type { GetTextIn } from '@/components/LanguagePicker/useLanguage'
import { toExportRows } from '@/pages/CloseToGraduation/Beta/excelExport'
import {
  describeFilters,
  emptyFilters,
  filterStudents,
  getFilterOptions,
  pruneFilters,
  type FilterOption,
} from '@/pages/CloseToGraduation/Beta/filters'
import type { CloseToGraduationData } from '@oodikone/shared/routes/populations'
import { DegreeProgrammeType, EnrollmentType, type Name } from '@oodikone/shared/types'

const getTextInLanguage = (language: 'fi' | 'en') =>
  ((text: Name | string | null | undefined, lang?: string) =>
    typeof text === 'string' ? text : (text?.[lang ?? language] ?? text?.fi ?? null)) as GetTextIn

const getTextIn = getTextInLanguage('fi')

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
  faculty: string
  programmeCode: string
  programmeName: string
  studyTrack?: string | null
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
    studyTrack: studyTrack ? { fi: studyTrack } : null,
    startedAt: new Date('2021-08-01'),
    degreeProgrammeType: DegreeProgrammeType.BACHELOR,
  },
  faculty: { fi: faculty },
  attainmentDates: { latestTotal: new Date('2024-05-15') },
  numberOfAbsentSemesters: 0,
  numberOfUsedSemesters: 6,
  curriculumPeriod,
  credits: { hops: 170, all: 175 },
})

const students = [
  createStudent({
    studentNumber: '1',
    faculty: 'Oikeustieteellinen tiedekunta',
    programmeCode: 'KH20_001',
    programmeName: 'Oikeusnotaarin koulutusohjelma',
    isBaMa: true,
  }),
  createStudent({
    studentNumber: '2',
    faculty: 'Matemaattis-luonnontieteellinen tiedekunta',
    programmeCode: 'KH50_001',
    programmeName: 'Matemaattisten tieteiden kandiohjelma',
    studyTrack: 'Matematiikka',
    thesisCompleted: true,
  }),
  createStudent({
    studentNumber: '3',
    faculty: 'Matemaattis-luonnontieteellinen tiedekunta',
    programmeCode: 'KH50_005',
    programmeName: 'Tietojenkäsittelytieteen kandiohjelma',
    curriculumPeriod: '2020-2023',
    preferredLanguage: 'en',
  }),
]

const studentNumbersOf = (rows: CloseToGraduationData[]) => rows.map(row => row.student.studentNumber)

void describe('filterStudents', () => {
  void it('returns every student when no filter is set', () => {
    assert.deepEqual(studentNumbersOf(filterStudents(students, emptyFilters, getTextIn)), ['1', '2', '3'])
  })

  void it('filters by faculty name', () => {
    const filters = { ...emptyFilters, faculties: ['Matemaattis-luonnontieteellinen tiedekunta'] }
    assert.deepEqual(studentNumbersOf(filterStudents(students, filters, getTextIn)), ['2', '3'])
  })

  void it('filters by programme code', () => {
    assert.deepEqual(
      studentNumbersOf(filterStudents(students, { ...emptyFilters, programmes: ['KH50_005'] }, getTextIn)),
      ['3']
    )
  })

  void it('filters by the yes/no toggles', () => {
    assert.deepEqual(studentNumbersOf(filterStudents(students, { ...emptyFilters, isBaMa: true }, getTextIn)), ['1'])
    assert.deepEqual(
      studentNumbersOf(filterStudents(students, { ...emptyFilters, thesisCompleted: false }, getTextIn)),
      ['1', '3']
    )
  })

  void it('combines filters', () => {
    const filters = {
      ...emptyFilters,
      faculties: ['Matemaattis-luonnontieteellinen tiedekunta'],
      thesisCompleted: false,
    }
    assert.deepEqual(studentNumbersOf(filterStudents(students, filters, getTextIn)), ['3'])
  })
})

void describe('getFilterOptions', () => {
  void it('narrows programme options by the selected faculties', () => {
    const options = getFilterOptions(
      students,
      { ...emptyFilters, faculties: ['Matemaattis-luonnontieteellinen tiedekunta'], programmes: ['KH50_001'] },
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
      ['Matemaattis-luonnontieteellinen tiedekunta', 2],
      ['Oikeustieteellinen tiedekunta', 1],
    ])
    assert.deepEqual(countsOf(options.programmes), [
      ['KH50_001', 1],
      ['KH20_001', 1],
      ['KH50_005', 1],
    ])
  })

  void it('ignores the filter’s own selection when counting its options', () => {
    const options = getFilterOptions(
      students,
      { ...emptyFilters, faculties: ['Oikeustieteellinen tiedekunta'] },
      getTextIn
    )
    assert.deepEqual(countsOf(options.faculties), [
      ['Matemaattis-luonnontieteellinen tiedekunta', 2],
      ['Oikeustieteellinen tiedekunta', 1],
    ])
    assert.deepEqual(countsOf(options.programmes), [['KH20_001', 1]])
  })

  void it('applies the other filters to the counts and keeps options that drop to zero', () => {
    const options = getFilterOptions(students, { ...emptyFilters, thesisCompleted: true }, getTextIn)
    assert.deepEqual(countsOf(options.faculties), [
      ['Matemaattis-luonnontieteellinen tiedekunta', 1],
      ['Oikeustieteellinen tiedekunta', 0],
    ])
  })
})

void describe('pruneFilters', () => {
  void it('drops programmes outside the selected faculties', () => {
    const filters = {
      ...emptyFilters,
      faculties: ['Oikeustieteellinen tiedekunta'],
      programmes: ['KH50_001', 'KH20_001'],
    }
    const pruned = pruneFilters(students, filters, getTextIn)
    assert.deepEqual(pruned.programmes, ['KH20_001'])
    assert.deepEqual(pruned.faculties, ['Oikeustieteellinen tiedekunta'])
  })
})

void describe('faculty selections across languages', () => {
  const lawStudent = { ...students[0], faculty: { fi: 'Oikeustieteellinen tiedekunta', en: 'Faculty of Law' } }
  const filters = { ...emptyFilters, faculties: ['Oikeustieteellinen tiedekunta'] }

  void it('keeps a selected faculty active and labels it in the current language', () => {
    const inEnglish = getTextInLanguage('en')
    assert.deepEqual(studentNumbersOf(filterStudents([lawStudent], filters, inEnglish)), ['1'])
    assert.deepEqual(getFilterOptions([lawStudent], filters, inEnglish).faculties, [
      { text: 'Faculty of Law', value: 'Oikeustieteellinen tiedekunta', count: 1 },
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
      faculties: ['Matemaattis-luonnontieteellinen tiedekunta'],
      programmes: ['KH50_001', 'KH50_005'],
      isBaMa: false,
    }
    const descriptions = describeFilters(filters, getFilterOptions(students, filters, getTextIn))
    assert.deepInclude(descriptions, { label: 'Faculty', value: 'Matemaattis-luonnontieteellinen tiedekunta' })
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

void describe('toExportRows', () => {
  void it('flattens a student into readable export columns with enrollment statuses', () => {
    const semesters = {
      '143': { semestercode: 143, name: { fi: 'Syksy 2021' } },
      '144': { semestercode: 144, name: { fi: 'Kevät 2022' } },
    } as unknown as Parameters<typeof toExportRows>[2]
    const [row] = toExportRows([students[1]], getTextIn, semesters, [143, 144])

    assert.equal(row['Student number'], '2')
    assert.equal(row.Faculty, 'Matemaattis-luonnontieteellinen tiedekunta')
    assert.equal(row['Study track'], 'Matematiikka')
    assert.equal(row['Preferred language'], 'Finnish')
    assert.equal(row['Thesis completed'], 'Yes')
    assert.equal(row['Thesis attainment date'], '2024-05-15')
    assert.equal(row['Enrollment status – Syksy 2021'], 'Present')
    assert.equal(row['Enrollment status – Kevät 2022'], 'No study right')
  })
})
