import React from 'react'
import { Form } from 'semantic-ui-react'

import { DateTimeSelector } from '@/components/DateTimeSelector'

export const DateRangeSelector = ({ value, onChange, ...rest }) => {
  const start = value ? value[0] : null
  const end = value ? value[1] : null
  return (
    <Form style={{}}>
      <Form.Field>
        <label>Beginning:</label>
        <DateTimeSelector before={end} onChange={date => onChange([date, end])} value={start} {...rest} />
      </Form.Field>
      <Form.Field>
        <label>Ending:</label>
        <DateTimeSelector after={start} onChange={date => onChange([start, date])} value={end} {...rest} />
      </Form.Field>
    </Form>
  )
}
