import { Form } from 'semantic-ui-react'

import { DateSelector } from '@/components/DateSelector'

export const DateRangeSelector = ({ value, onChange, ...rest }) => {
  const start = value ? value[0] : null
  const end = value ? value[1] : null
  return (
    <Form style={{}}>
      <Form.Field>
        <label>Beginning:</label>
        <DateSelector before={end} onChange={date => onChange([date, end])} value={start} {...rest} />
      </Form.Field>
      <Form.Field>
        <label>Ending:</label>
        <DateSelector after={start} onChange={date => onChange([start, date])} value={end} {...rest} />
      </Form.Field>
    </Form>
  )
}
