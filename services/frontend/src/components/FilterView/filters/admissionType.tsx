import { Form, Dropdown } from 'semantic-ui-react'

import { ADMISSION_TYPES } from '@/common'
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

const AdmissionTypeFilterCard = ({ options, onOptionsChange, students, code }) => {
  const { selected } = options
  const name = 'admissionTypeFilter'

  const count = (admissionType: string | null): number => students.filter(filter(code)(admissionType)).length

  const dropdownOptions = Object.entries(ADMISSION_TYPES)
    .filter(([_, admissionType]) => !!admissionType)
    .map(([key, admissionType]) => {
      const value = admissionType ?? 'Ei valintatapaa'
      const amount = count(admissionType)

      return {
        key,
        text: `${value} ${amount}`,
        value,
        amount,
      }
    })
    .filter(a => a.amount)
    .sort((a, b) => b.amount - a.amount)

  return (
    <div className="card-content">
      <Form>
        <Dropdown
          button
          className="mini"
          clearable
          data-cy={`${name}-dropdown`}
          fluid
          onChange={(_, { value }) => onOptionsChange({ selected: value })}
          options={dropdownOptions}
          placeholder="Choose admission type"
          selectOnBlur={false}
          selection
          value={selected}
        />
      </Form>
    </div>
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

  render: (props, { args }) => <AdmissionTypeFilterCard {...props} code={args.programme} />,
})
