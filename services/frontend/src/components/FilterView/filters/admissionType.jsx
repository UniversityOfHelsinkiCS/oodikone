import React from 'react'
import { Form, Dropdown } from 'semantic-ui-react'
import { createFilter } from './createFilter'

// Naming follows convention from SIS API (e.g urn:code:admissiont-type:m for "Muu")
// Except changed Koepisteet to Valintakoe
const ADMISSION_TYPES = {
  M: 'Muu',
  KM: 'Kilpailumenestys',
  TV: 'Todistusvalinta',
  AV: 'Avoin väylä',
  KP: 'Valintakoe',
  YP: 'Yhteispisteet',
  N: null,
}

const filter = code => value => student =>
  student.studyrights.some(studyright => {
    const fixedValue = value !== 'Valintakoe' ? value : 'Koepisteet'
    return (
      studyright.studyright_elements.some(element => element.code === code) &&
      (value === null || value === 'Ei valintatapaa'
        ? !studyright.admission_type
        : studyright.admission_type === fixedValue)
    )
  })

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

  title: 'Admission Type',

  defaultOptions: {
    selected: null,
  },

  isActive: ({ selected }) => !!selected,

  filter(student, { selected }, { args }) {
    return filter(args.programme)(selected)(student)
  },

  render: (props, { args }) => <AdmissionTypeFilterCard {...props} code={args.programme} />,
})
