import { ADMISSION_TYPES } from '@/common'
import { FormattedStudent } from '@oodikone/shared/types/studentData'
import { FilterTrayProps } from '../FilterTray'
import { FilterSelect } from './common/FilterSelect'
import { createFilter } from './createFilter'

const findAllStudyRightsForProgramme = (student: FormattedStudent, programme: string) =>
  student.studyRights.filter(studyRight => studyRight.studyRightElements.some(el => el.code === programme))

export const filter = (programme: string, value: string | null) => (student: FormattedStudent) => {
  const programmeStudyRights = findAllStudyRightsForProgramme(student, programme)
  const fixedValue = value !== 'Valintakoe' ? value : 'Koepisteet'

  return programmeStudyRights.some(
    studyRight =>
      !studyRight.cancelled &&
      (value === null || value === 'Ei valintatapaa'
        ? !studyRight.admissionType
        : studyRight.admissionType === fixedValue)
  )
}

const AdmissionTypeFilterCard = ({ options, onOptionsChange, precomputed }: FilterTrayProps) => {
  const { selected } = options

  const selectOptions = Object.entries(ADMISSION_TYPES)
    .filter(([_, admissionType]) => !!admissionType)
    .map(([key, admissionType]) => {
      const value = admissionType ?? 'Ei valintatapaa'
      const amount = precomputed[admissionType!] ?? 0

      return {
        key,
        text: `${value} (${amount})`,
        value,
        amount,
      }
    })
    .filter(a => a.amount)
    .sort((a, b) => b.amount - a.amount)

  return (
    <FilterSelect
      filterKey="admissionTypeFilter"
      label="Choose admission type"
      onChange={({ target }) => onOptionsChange({ selected: target.value })}
      options={selectOptions}
      value={selected}
    />
  )
}

export const admissionTypeFilter = createFilter({
  key: 'admissionTypeFilter',

  title: 'Admission type',

  defaultOptions: {
    selected: '',
  },

  isActive: ({ selected }) => !!selected.length,

  precompute: ({ args, students }) =>
    students
      .flatMap(student =>
        findAllStudyRightsForProgramme(student, args.programme)
          .filter(studyRight => !studyRight.cancelled && !!studyRight.admissionType)
          .map(studyRight => studyRight.admissionType)
      )
      .reduce((acc, cur) => {
        acc[cur] ??= 0
        acc[cur] += 1

        return acc
      }, {}),

  filter: (student, { args, options }) => filter(args.programme, options.selected)(student),

  render: AdmissionTypeFilterCard,
})
