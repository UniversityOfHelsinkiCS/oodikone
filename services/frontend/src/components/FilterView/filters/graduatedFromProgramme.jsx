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

  title: 'Graduated from programme',

  defaultOptions: {
    mode: null,
  },

  isActive: ({ mode }) => mode !== null,

  filter(student, { mode }, { args }) {
    const chosenProgrammeCode =
      (mode === 2 || mode === -1) && args.combinedProgrammeCode ? args.combinedProgrammeCode : args.code
    const correctStudyRight = student.studyRights.find(studyRight =>
      studyRight.studyRightElements.some(el => el.code === chosenProgrammeCode)
    )
    const hasGraduated =
      correctStudyRight != null &&
      correctStudyRight.studyRightElements.find(el => el.code === chosenProgrammeCode).graduated
    const keepGraduated = mode > 0

    return keepGraduated === hasGraduated
  },

  render: (props, { args }) => (
    <GraduatedFromProgrammeFilterCard
      {...props}
      isCombinedExtent={args.code && args.combinedProgrammeCode}
      isLicentiate={args.combinedProgrammeCode === 'MH90_001'}
    />
  ),
})
