import React from 'react'
import { Form, Radio } from 'semantic-ui-react'
import createFilter from './createFilter'

const GraduatedFromProgrammeFilterCard = ({ options, onOptionsChange, isCombinedExtent }) => {
  const { mode } = options

  const modeOptions = isCombinedExtent
    ? [
        { key: 'not-graduated-bachelor', text: `Not graduated with Bachelor's`, value: 0 },
        { key: 'not-graduated-master', text: `Not graduated with Master's`, value: -1 },
        { key: 'graduated-bachelor', text: `Graduated with Bachelor's`, value: 1 },
        { key: 'graduated-master', text: `Graduated with Master's`, value: 2 },
      ]
    : [
        { key: 'graduated-false', text: `Not Graduated`, value: 0 },
        { key: 'graduated-true', text: `Graduated`, value: 1 },
      ]

  return (
    <Form>
      <div className="card-content">
        <Form.Field style={{ display: 'flex', flexDirection: 'column' }}>
          <Radio
            label="All"
            checked={mode === null}
            onChange={() => onOptionsChange({ mode: null })}
            style={{ marginBottom: '0.5rem' }}
            data-cy="option-all"
          />
          {modeOptions.map(option => (
            <Radio
              key={option.key}
              label={option.text}
              name="radioGroup"
              style={{ marginBottom: '0.5rem' }}
              checked={mode === option.value}
              onChange={() => onOptionsChange({ mode: option.value })}
              data-cy={`option-${option.key}`}
            />
          ))}
        </Form.Field>
      </div>
    </Form>
  )
}

export default createFilter({
  key: 'GraduatedFromProgramme',

  title: 'Graduated From Programme',

  defaultOptions: {
    mode: null,
  },

  precompute: ({ args }) => ({
    isCombinedExtent: args.code && (!args.code.includes('_') || args.combinedProgrammeCode),
  }),

  isActive: ({ mode }) => mode !== null,

  filter(student, { mode }, { args, precomputed }) {
    let examinedStudyRights = student.studyrights

    if (precomputed.isCombinedExtent && mode > 0) {
      examinedStudyRights = student.studyrights.filter(sr => sr.extentcode === mode)
    }

    const keepGraduated = mode > 0
    const chosenProgrammeCode =
      (mode === 2 || mode === -1) && args.combinedProgrammeCode ? args.combinedProgrammeCode : args.code
    return (
      keepGraduated ===
      examinedStudyRights.some(sr =>
        sr.studyright_elements.some(sre => {
          const dateMatch = new Date(sre.enddate) >= new Date(sr.enddate)
          return sre.code === chosenProgrammeCode && dateMatch && sr.graduated
        })
      )
    )
  },

  render: (props, { precomputed }) => (
    <GraduatedFromProgrammeFilterCard {...props} isCombinedExtent={precomputed.isCombinedExtent} />
  ),
})
