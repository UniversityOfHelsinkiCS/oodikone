import React from 'react'
import { Form, Radio } from 'semantic-ui-react'
import { createFilter } from './createFilter'

const GraduatedFromProgrammeFilterCard = ({ options, onOptionsChange, isCombinedExtent, isLicentiate }) => {
  const { mode } = options
  const typeOfCombined = isLicentiate ? 'Licentiate' : 'Master'
  const modeOptions = isCombinedExtent
    ? [
        { key: 'graduated-bachelor', text: "Graduated with Bachelor's", value: 1 },
        { key: 'graduated-master', text: `Graduated with ${typeOfCombined}'s`, value: 2 },
        { key: 'not-graduated-bachelor', text: "Not graduated with Bachelor's", value: 0 },
        { key: 'not-graduated-master', text: `Not graduated with ${typeOfCombined}'s`, value: -1 },
      ]
    : [
        { key: 'graduated-true', text: 'Graduated', value: 1 },
        { key: 'graduated-false', text: 'Not graduated', value: 0 },
      ]

  return (
    <Form>
      <div className="card-content">
        <Form.Field style={{ display: 'flex', flexDirection: 'column' }}>
          <Radio
            checked={mode === null}
            data-cy="option-all"
            label="All"
            onChange={() => onOptionsChange({ mode: null })}
            style={{ marginBottom: '0.5rem' }}
          />
          {modeOptions.map(option => (
            <Radio
              checked={mode === option.value}
              data-cy={`option-${option.key}`}
              key={option.key}
              label={option.text}
              name="radioGroup"
              onChange={() => onOptionsChange({ mode: option.value })}
              style={{ marginBottom: '0.5rem' }}
            />
          ))}
        </Form.Field>
      </div>
    </Form>
  )
}

export const graduatedFromProgrammeFilter = createFilter({
  key: 'GraduatedFromProgramme',

  title: 'Graduated From Programme',

  defaultOptions: {
    mode: null,
  },

  precompute: ({ args }) => ({
    isCombinedExtent: args.code && (!args.code.includes('_') || args.combinedProgrammeCode),
    isLicentiate: args.combinedProgrammeCode === 'MH90_001',
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
    <GraduatedFromProgrammeFilterCard
      {...props}
      isCombinedExtent={precomputed.isCombinedExtent}
      isLicentiate={precomputed.isLicentiate}
    />
  ),
})
