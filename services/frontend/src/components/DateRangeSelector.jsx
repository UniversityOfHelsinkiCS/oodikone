import React from 'react'
import { Form } from 'semantic-ui-react'
import DateTimeSelector from 'components/DateTimeSelector'

const DateRangeSelector = ({ value, onChange, ...rest }) => {
  return (
    <Form style={{}}>
      <Form.Field>
        <label>Beginning:</label>
        <DateTimeSelector
          value={value?.[0]}
          before={value?.[1]}
          onChange={date => onChange([date, value?.[1]])}
          {...rest}
        />
      </Form.Field>
      <Form.Field>
        <label>Ending:</label>
        <DateTimeSelector
          value={value?.[1]}
          after={value?.[0]}
          onChange={date => onChange([value?.[0], date])}
          {...rest}
        />
      </Form.Field>
    </Form>
  )
}

export default DateRangeSelector
