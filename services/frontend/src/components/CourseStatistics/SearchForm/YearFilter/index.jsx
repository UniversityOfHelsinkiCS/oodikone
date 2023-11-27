import React from 'react'
import { arrayOf, func, number, shape } from 'prop-types'
import { Form } from 'semantic-ui-react'

export const YearFilter = ({ years, fromYear, toYear, handleChange }) => (
  <Form>
    <Form.Group inline>
      <Form.Dropdown
        label="From:"
        name="fromYear"
        options={toYear ? years.filter(({ value }) => value <= toYear) : years}
        selection
        inline
        placeholder="Select academic year"
        onChange={handleChange}
        value={fromYear}
        selectOnBlur={false}
        selectOnNavigation={false}
      />
      <Form.Dropdown
        label="To:"
        name="toYear"
        options={fromYear ? years.filter(({ value }) => value >= fromYear) : years}
        inline
        selection
        placeholder="Select academic year"
        onChange={handleChange}
        value={toYear}
        selectOnBlur={false}
        selectOnNavigation={false}
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
