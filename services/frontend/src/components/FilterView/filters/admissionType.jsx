import React from 'react'
import { Form, Dropdown } from 'semantic-ui-react'
import createFilter from './createFilter'

// Naming follows convention from SIS API (e.g urn:code:admissiont-type:m for "Muu")
const ADMISSION_TYPES = {
  M: 'Muu',
  KM: 'Kilpailumenestys',
  TV: 'Todistusvalinta',
  AV: 'Avoin väylä',
  KP: 'Koepisteet',
  YP: 'Yhteispisteet',
  N: null,
}

const admissionTypeFilter = code => value => student =>
  student.studyrights.some(
    sr =>
      sr.studyright_elements.some(sre => sre.code === code) &&
      (value === null || value === 'Ei valintatapaa' ? !sr.admission_type : sr.admission_type === value)
  )

const AdmissionTypeFilterCard = ({ options, onOptionsChange, withoutSelf, code }) => {
  const { selected } = options
  const name = 'admissionTypeFilter'

  const count = admissionType => withoutSelf().filter(admissionTypeFilter(code)(admissionType)).length

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
          options={dropdownOptions}
          value={selected}
          onChange={(_, { value }) =>
            onOptionsChange({
              selected: value,
            })
          }
          placeholder="Choose admission type"
          className="mini"
          selection
          selectOnBlur={false}
          fluid
          button
          clearable
          data-cy={`${name}-dropdown`}
        />
      </Form>
    </div>
  )
}

export default createFilter({
  key: 'AdmissionType',

  title: 'Admission Type',

  defaultOptions: {
    selected: null,
  },

  isActive: ({ selected }) => selected !== null,

  filter(student, { selected }, { args }) {
    return admissionTypeFilter(args.programme)(selected)(student)
  },

  render: (props, { args }) => <AdmissionTypeFilterCard {...props} code={args.programme} />,
})
