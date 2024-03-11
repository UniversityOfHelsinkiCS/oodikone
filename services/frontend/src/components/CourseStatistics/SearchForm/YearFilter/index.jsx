import { arrayOf, func, number, shape } from 'prop-types'
import React from 'react'
import { Form } from 'semantic-ui-react'

export const YearFilter = ({ years, fromYear, toYear, handleChange }) => (
  <Form>
    <Form.Group inline>
      <Form.Dropdown
        inline
        label="From:"
        name="fromYear"
        onChange={handleChange}
        options={toYear ? years.filter(({ value }) => value <= toYear) : years}
        placeholder="Select academic year"
        selectOnBlur={false}
        selectOnNavigation={false}
        selection
        value={fromYear}
      />
      <Form.Dropdown
        inline
        label="To:"
        name="toYear"
        onChange={handleChange}
        options={fromYear ? years.filter(({ value }) => value >= fromYear) : years}
        placeholder="Select academic year"
        selectOnBlur={false}
        selectOnNavigation={false}
        selection
        value={toYear}
      />
    </Form.Group>
  </Form>
)

YearFilter.propTypes = {
  years: arrayOf(shape({})).isRequired,
  fromYear: number,
  toYear: number,
  handleChange: func.isRequired,
}

YearFilter.defaultProps = {
  fromYear: undefined,
  toYear: undefined,
}
