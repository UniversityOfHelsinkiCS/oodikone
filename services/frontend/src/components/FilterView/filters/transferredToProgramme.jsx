import React from 'react'
import { Form, Radio } from 'semantic-ui-react'

import { filterToolTips } from '@/common/InfoToolTips'
import { createFilter } from './createFilter'

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
            checked={transferred === null}
            data-cy="option-all"
            label="All"
            name="radioGroup"
            onChange={toggle(null)}
          />
          <Radio
            checked={transferred === true}
            data-cy="option-have"
            label="Transferred"
            name="radioGroup"
            onChange={toggle(true)}
            style={{ margin: '0.5rem 0' }}
          />
          <Radio
            checked={transferred === false}
            data-cy="option-havenot"
            label="Not Transferred"
            name="radioGroup"
            onChange={toggle(false)}
          />
        </Form.Field>
      </div>
    </Form>
  )
}

export const transferredToProgrammeFilter = createFilter({
  key: 'TransferredToProgramme',

  title: 'Transferred to Programme',

  info: filterToolTips.transferred,

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
