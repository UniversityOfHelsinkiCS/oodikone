import React from 'react'
import { Form } from 'semantic-ui-react'
import { string, arrayOf, shape, func, oneOfType, number } from 'prop-types'
import { orderBy } from 'lodash'
import { DropdownItem } from './DropdownItem'
import { ClearableItem } from './ClearableItem'

export const ProgrammeDropdown = ({ options, label, name, onChange, onClear, value, ...props }) => (
  <Form.Dropdown
    options={orderBy(options, ['size'], ['desc']).map(({ key, size, value: v, text, description }) => ({
      key,
      content: <DropdownItem name={text} code={key} size={size} description={description} />,
      text: !onClear ? text : <ClearableItem name={text} onClear={onClear} />,
      value: v,
    }))}
    selection
    multiple
    fluid
    label={label}
    name={name}
    onChange={onChange}
    search
    value={value}
    {...props}
    selectOnBlur={false}
    selectOnNavigation={false}
  />
)

ProgrammeDropdown.propTypes = {
  label: string.isRequired,
  name: string.isRequired,
  onChange: func.isRequired,
  onClear: func,
  value: arrayOf(string),
  options: arrayOf(
    shape({
      code: oneOfType([string, number]),
      count: oneOfType([string, number]),
      value: oneOfType([string, number]),
      text: oneOfType([string, number]),
      size: oneOfType([string, number]),
    })
  ).isRequired,
}

ProgrammeDropdown.defaultProps = {
  value: [],
  onClear: undefined,
}
