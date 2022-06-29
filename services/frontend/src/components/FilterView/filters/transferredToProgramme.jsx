import React from 'react'
import { Form, Radio } from 'semantic-ui-react'
import createFilter from './createFilter'
import filterInfo from '../../../common/InfoToolTips/filters'

const TransferredToProgrammeFilterCard = ({ options, onOptionsChange }) => {
  const { transferred } = options

  const toggle = buttonValue => () =>
    onOptionsChange({
      transferred: transferred === buttonValue ? null : buttonValue,
    })

  return (
    <Form>
      <div className="card-content">
        <Form.Field style={{ display: 'flex', flexDirection: 'column' }}>
          <Radio
            label="All"
            name="radioGroup"
            checked={transferred === null}
            onChange={toggle(null)}
            data-cy="option-all"
          />
          <Radio
            label="Transferred"
            name="radioGroup"
            checked={transferred === true}
            onChange={toggle(true)}
            data-cy="option-have"
            style={{ margin: '0.5rem 0' }}
          />
          <Radio
            label="Not Transferred"
            name="radioGroup"
            checked={transferred === false}
            onChange={toggle(false)}
            data-cy="option-havenot"
          />
        </Form.Field>
      </div>
    </Form>
  )
}

export default createFilter({
  key: 'TransferredToProgramme',

  title: 'Transferred to Programme',

  info: filterInfo.transferred,

  defaultOptions: {
    transferred: null,
  },

  isActive: ({ transferred }) => transferred !== null,

  filter: (student, { transferred }) => student.transferredStudyright === transferred,

  actions: {
    set: (options, value) => {
      options.transferred = value
    },
  },

  component: TransferredToProgrammeFilterCard,
})
