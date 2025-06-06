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
      <Form.Field style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
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
        />
        <Radio
          checked={transferred === false}
          data-cy="option-havenot"
          label="Not transferred"
          name="radioGroup"
          onChange={toggle(false)}
        />
      </Form.Field>
    </Form>
  )
}

export const transferredToProgrammeFilter = createFilter({
  key: 'TransferredToProgramme',

  title: 'Transferred to programme',

  info: filterToolTips.transferred,

  defaultOptions: {
    transferred: null,
  },

  isActive: ({ transferred }) => transferred !== null,

  filter: (student, { options }) => {
    const { transferred } = options

    return student.transferredStudyright === transferred
  },

  actions: {
    set: (options, value) => {
      options.transferred = value
    },
  },

  render: TransferredToProgrammeFilterCard,
})
