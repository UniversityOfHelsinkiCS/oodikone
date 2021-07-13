import React from 'react'
import PropTypes from 'prop-types'
import { Button } from 'semantic-ui-react'
import './creditDateFilter.css'

// FYI: I spent over an hour trying to make this button also close the date picker.
// Do not try it, use the time to roast react-datetime devs instead...
const DateButton = ({ value }, openCalendar) => {
  return <Button content={value} onClick={openCalendar} className="credit-date-filter-input" />
}

DateButton.propTypes = {
  value: PropTypes.string.isRequired
}

export default DateButton
