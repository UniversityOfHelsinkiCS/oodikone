import { Form, Dropdown } from 'semantic-ui-react'

import { ADMISSION_TYPES } from '@/common'
import { createFilter } from './createFilter'

const findAllStudyrightsForProgramme = (student, programme) => {
  return student.studyrights.filter(studyright =>
    studyright.studyright_elements.some(element => element.code === programme)
  )
}

export const filter = code => value => student => {
  const programmeStudyrights = findAllStudyrightsForProgramme(student, code)
  const fixedValue = value !== 'Valintakoe' ? value : 'Koepisteet'

  if (programmeStudyrights.length === 0) return false

  if (programmeStudyrights.length === 1) {
    return value === null || value === 'Ei valintatapaa'
      ? !programmeStudyrights[0].admission_type
      : programmeStudyrights[0].admission_type === fixedValue
  }

  return programmeStudyrights.some(
    studyright =>
      !studyright.cancelled &&
      (value === null || value === 'Ei valintatapaa'
        ? !studyright.admission_type
        : studyright.admission_type === fixedValue)
  )
}

const AdmissionTypeFilterCard = ({ options, onOptionsChange, withoutSelf, code }) => {
  const { selected } = options
  const name = 'admissionTypeFilter'

  const count = admissionType => withoutSelf().filter(filter(code)(admissionType)).length

  const dropdownOptions = Object.entries(ADMISSION_TYPES).map(([key, admissionType]) => {
    const value = admissionType || 'Ei valintatapaa'
    return {
      key,
      text: `${value} (${count(admissionType)})`,
      value,
    }
  })

  return (
    <div className="card-content">
      <Form>
        <Dropdown
          button
          className="mini"
          clearable
          data-cy={`${name}-dropdown`}
          fluid
          onChange={(_, { value }) =>
            onOptionsChange({
              selected: value,
            })
          }
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

  filter(student, { selected }, { args }) {
    return filter(args.programme)(selected)(student)
  },

  render: (props, { args }) => <AdmissionTypeFilterCard {...props} code={args.programme} />,
})
