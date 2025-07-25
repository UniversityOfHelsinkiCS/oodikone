import { ADMISSION_TYPES } from '@/common'
import { FilterTrayProps } from '../FilterTray'
import { FilterSelect } from './common/FilterSelect'
import { createFilter } from './createFilter'

const findAllStudyRightsForProgramme = (student, programme) =>
  student.studyRights.filter(studyRight => studyRight.studyRightElements.some(el => el.code === programme))

export const filter = code => value => student => {
  const programmeStudyRights = findAllStudyRightsForProgramme(student, code)
  const fixedValue = value !== 'Valintakoe' ? value : 'Koepisteet'

  return programmeStudyRights.some(
    studyRight =>
      !studyRight.cancelled &&
      (value === null || value === 'Ei valintatapaa'
        ? !studyRight.admissionType
        : studyRight.admissionType === fixedValue)
  )
}

const AdmissionTypeFilterCard = ({ args, options, onOptionsChange, students }: FilterTrayProps) => {
  const code = args.programme
  const { selected } = options
  const count = (admissionType: string | null): number => students.filter(filter(code)(admissionType)).length

  const selectOptions = Object.entries(ADMISSION_TYPES)
    .filter(([_, admissionType]) => !!admissionType)
    .map(([key, admissionType]) => {
      const value = admissionType ?? 'Ei valintatapaa'
      const amount = count(admissionType)

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
  key: 'AdmissionType',

  title: 'Admission type',

  defaultOptions: {
    selected: null,
  },

  isActive: ({ selected }) => !!selected,

  filter(student, { args, options }) {
    const { selected } = options

    return filter(args.programme)(selected)(student)
  },

  render: AdmissionTypeFilterCard,
})
