import React from 'react'
import { Form } from 'semantic-ui-react'
import { DateTimeSelector } from '../DateTimeSelector'

export const DateRangeSelector = ({ value, onChange, ...rest }) => {
  const start = value ? value[0] : null
  const end = value ? value[1] : null
  return (
    <Form style={{}}>
      <Form.Field>
        <label>Beginning:</label>
        <DateTimeSelector value={start} before={end} onChange={date => onChange([date, end])} {...rest} />
      </Form.Field>
      <Form.Field>
        <label>Ending:</label>
        <DateTimeSelector value={end} after={start} onChange={date => onChange([start, date])} {...rest} />
      </Form.Field>
    </Form>
  )
}
