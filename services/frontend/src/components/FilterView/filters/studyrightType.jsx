import moment from 'moment'
import React from 'react'
import { Form, Radio } from 'semantic-ui-react'
import { createFilter } from './createFilter'

const STUDYRIGHT_TYPES = {
  all: { label: 'All', value: 0 },
  bama: { label: 'Bachelor + master', value: 1 },
  master: { label: 'Master only', value: 2 },
}

const StudyrightTypeFilterCard = ({ options, onOptionsChange }) => {
  const { mode } = options

  const modeOptions = Object.entries(STUDYRIGHT_TYPES).map(([key, studyrightType]) => ({
    key,
    text: studyrightType.label,
    value: studyrightType.value,
  }))

  return (
    <Form>
      <div className="card-content">
        <Form.Field style={{ display: 'flex', flexDirection: 'column' }}>
          {modeOptions.map(option => (
            <Radio
              checked={mode === option.value}
              data-cy={option.key}
              label={option.text}
              key={option.key}
              onChange={() => onOptionsChange({ mode: option.value })}
              style={{ marginBottom: '0.5rem' }}
            />
          ))}
        </Form.Field>
      </div>
    </Form>
  )
}

const findStudyrightElement = (element, startdate, programme, year) => {
  if (element.code !== programme) return false

  const date = moment(new Date(`${year}-08-01`))
  const startDate = moment(new Date(startdate))
  const endDate = moment(new Date(element.enddate))
  return date.isBetween(startDate, endDate, undefined, '[]')
}

export const studyrightTypeFilter = createFilter({
  key: 'studyright-type',

  title: 'Studyright Type',

  defaultOptions: {
    mode: 0,
  },

  isActive: ({ mode }) => mode !== 0,

  filter(student, { mode }, { args }) {
    if (mode === 0) {
      return true
    }

    const isFound = student.studyrights.some(
      studyright =>
        studyright.is_ba_ma &&
        studyright.studyright_elements.some(element =>
          findStudyrightElement(element, studyright.startdate, args.programme, args.year)
        )
    )

    return isFound === (mode === 1)
  },

  component: StudyrightTypeFilterCard,
})
