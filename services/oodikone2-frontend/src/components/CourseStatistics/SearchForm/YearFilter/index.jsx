import React, { Fragment } from 'react'
import { arrayOf, func, number, shape } from 'prop-types'
import { Form } from 'semantic-ui-react'

const YearFilter = ({ years, fromYear, toYear, handleChange }) => (
  <Fragment>
    <Form.Group widths="equal" inline>
      <Form.Dropdown
        label="From:"
        name="fromYear"
        options={years}
        selection
        inline
        placeholder="Select academic year"
        onChange={handleChange}
        value={fromYear}
      />
      <Form.Dropdown
        label="To:"
        name="toYear"
        options={years}
        inline
        selection
        placeholder="Select academic year"
        onChange={handleChange}
        value={toYear}
      />
    </Form.Group>
  </Fragment>
)

YearFilter.propTypes = {
  years: arrayOf(shape({})).isRequired,
  fromYear: number,
  toYear: number,
  handleChange: func.isRequired
}

YearFilter.defaultProps = {
  fromYear: undefined,
  toYear: undefined
}

export default YearFilter
