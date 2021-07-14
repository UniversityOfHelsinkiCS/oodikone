import React from 'react'
import PropTypes from 'prop-types'
import Datetime from 'react-datetime'
import 'moment/locale/fi'
import DateButton from './DateButton'

const DateTime = ({ value, onChange }) => {
  return (
    <Datetime value={value} onChange={onChange} timeFormat={false} locale="fi" closeOnSelect renderInput={DateButton} />
  )
}

DateTime.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.shape({})]).isRequired,
  onChange: PropTypes.func.isRequired,
}

export default DateTime
