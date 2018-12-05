import React, { Fragment } from 'react'
import { arrayOf, bool, func, number, shape } from 'prop-types'
import { Form } from 'semantic-ui-react'

const YearFilter = ({ years, fromYear, toYear, handleChange, separate, onToggleCheckbox }) => (
  <Fragment>
    <Form.Group widths="equal">
      <Form.Dropdown
        label="From:"
        name="fromYear"
        options={years}
        selection
        placeholder="Select academic year"
        onChange={handleChange}
        value={fromYear}
      />
      <Form.Dropdown
        label="To:"
        name="toYear"
        options={years}
        selection
        placeholder="Select academic year"
        onChange={handleChange}
        value={toYear}
      />
    </Form.Group>
    <Form.Checkbox
      label="Separate statistics for Spring and Fall semesters"
      name="separate"
      onChange={onToggleCheckbox}
      checked={separate}
    />
  </Fragment>
)

YearFilter.propTypes = {
  years: arrayOf(shape({})).isRequired,
  fromYear: number,
  toYear: number,
  handleChange: func.isRequired,
  onToggleCheckbox: func.isRequired,
  separate: bool.isRequired
}

YearFilter.defaultProps = {
  fromYear: undefined,
  toYear: undefined
}

export default YearFilter
