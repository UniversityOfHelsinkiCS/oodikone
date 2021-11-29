import React from 'react'
import { Form, Radio } from 'semantic-ui-react'
import createFilter from './createFilter'

const GraduatedFromProgrammeFilterCard = ({ options, onOptionsChange, isCombinedExtent }) => {
  // const { addFilter, removeFilter } = useFilters()
  const { mode } = options
  // const [value, setValue] = useState(null)
  const name = 'graduatedFromProgrammeFilter'
  // const active = value !== null
  // Old-style study programmes need separation between bachelor's and master's.
  // const combinedExtent = !code.includes('_')

  const modeOptions = [{ key: 'graduated-false', text: `Not Graduated`, value: 0 }].concat(
    isCombinedExtent
      ? [
          { key: 'graduated-bachelor', text: `Graduated with Bachelor's`, value: 1 },
          { key: 'graduated-master', text: `Graduated with Master's`, value: 2 },
        ]
      : [{ key: 'graduated-true', text: `Graduated`, value: 1 }]
  )

  return (
    <Form>
      <div className="card-content">
        <Form.Field>
          <Radio
            label="All"
            checked={mode === null}
            onChange={() => onOptionsChange({ mode: null })}
            style={{ marginBottom: '0.5rem' }}
            data-cy={`${name}-all`}
          />
          {modeOptions.map(option => (
            <Radio
              key={option.key}
              label={option.text}
              name="radioGroup"
              style={{ marginBottom: '0.5rem' }}
              checked={mode === option.value}
              onChange={() => onOptionsChange({ mode: option.value })}
              data-cy={`${name}-${option.key}`}
            />
          ))}
        </Form.Field>
      </div>
    </Form>
  )
}

export default code => {
  const isCombinedExtent = code && !code.includes('_')

  return createFilter({
    key: 'GraduatedFromProgramme',

    title: 'Graduated From Programme',

    defaultOptions: {
      mode: null,
    },

    isActive: ({ mode }) => mode !== null,

    filter(student, { mode }) {
      let examinedStudyRights = student.studyrights

      if (isCombinedExtent && mode > 0) {
        examinedStudyRights = student.studyrights.filter(sr => sr.extentcode === mode)
      }

      const keepGraduated = mode > 0

      return (
        keepGraduated ===
        examinedStudyRights.some(sr =>
          sr.studyright_elements.some(sre => {
            const dateMatch = new Date(sre.enddate) >= new Date(sr.enddate)
            return sre.code === code && dateMatch && sr.graduated
          })
        )
      )
    },

    render: props => <GraduatedFromProgrammeFilterCard {...props} isCombinedExtent={isCombinedExtent} />,
  })
}
