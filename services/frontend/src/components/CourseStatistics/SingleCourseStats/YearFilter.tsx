import { DropdownProps, Form } from 'semantic-ui-react'

interface YearFilterProps {
  years: Array<{ key: number; text: string; value: number }>
  fromYear: number
  toYear: number
  handleChange: (event: React.SyntheticEvent, data: DropdownProps) => void
}

export const YearFilter = ({ years, fromYear, toYear, handleChange }: YearFilterProps) => (
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
