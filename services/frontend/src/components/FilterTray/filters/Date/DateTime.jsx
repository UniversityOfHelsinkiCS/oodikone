import React from 'react'
import PropTypes from 'prop-types'
import Datetime from 'react-datetime'
import 'moment/locale/fi'
import { Icon, Button } from 'semantic-ui-react'
import moment from 'moment'

const DateTime = ({ value, onChange }) => {
  return (
    <Datetime
      value={value}
      onChange={onChange}
      timeFormat={false}
      locale="fi"
      closeOnSelect
      renderInput={(_, open) => (
        <Button
          icon={value !== null}
          labelPosition={value !== null && 'right'}
          onClick={open}
          className="credit-date-filter-input"
          style={{ whiteSpace: 'nowrap' }}
        >
          {value === null ? 'Select Date' : moment(value).format('DD.MM.YYYY')}
          {value !== null && (
            <Icon
              name="x"
              onClick={evt => {
                evt.stopPropagation()
                onChange(null)
              }}
            />
          )}
        </Button>
      )}
    />
  )
}

DateTime.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.shape({})]).isRequired,
  onChange: PropTypes.func.isRequired,
}

export default DateTime
