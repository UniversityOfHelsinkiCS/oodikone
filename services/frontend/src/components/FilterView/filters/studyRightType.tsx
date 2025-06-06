import { Form, Radio } from 'semantic-ui-react'

import { createFilter } from './createFilter'

const STUDYRIGHT_TYPES = {
  all: { label: 'All', value: 0 },
  bama: { label: 'Bachelor + master', value: 1 },
  master: { label: 'Master only', value: 2 },
}

const StudyRightTypeFilterCard = ({ options, onOptionsChange }) => {
  const { mode } = options

  const modeOptions = Object.entries(STUDYRIGHT_TYPES).map(([key, studyRightType]) => ({
    key,
    text: studyRightType.label,
    value: studyRightType.value,
  }))

  return (
    <Form>
      <div className="card-content">
        <Form.Field style={{ display: 'flex', flexDirection: 'column' }}>
          {modeOptions.map(option => (
            <Radio
              checked={mode === option.value}
              data-cy={option.key}
              key={option.key}
              label={option.text}
              onChange={() => onOptionsChange({ mode: option.value })}
              style={{ marginBottom: '0.5rem' }}
            />
          ))}
        </Form.Field>
      </div>
    </Form>
  )
}

export const studyRightTypeFilter = createFilter({
  key: 'studyRightTypeFilter',

  title: 'Study right type',

  defaultOptions: {
    mode: 0,
  },

  isActive: ({ mode }) => mode !== 0,

  filter(student, { args, options }) {
    const { mode } = options

    if (mode === 0) return true

    const studyRight = student.studyRights.find(studyRight =>
      studyRight.studyRightElements.some(el => el.code === args.programme)
    )

    if (!studyRight) return false

    return mode === 1 ? studyRight.extentCode === 5 : studyRight.extentCode === 2
  },

  render: StudyRightTypeFilterCard,
})
