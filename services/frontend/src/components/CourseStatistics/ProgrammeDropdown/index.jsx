import { orderBy } from 'lodash'
import { arrayOf, func, number, oneOfType, shape, string } from 'prop-types'
import React from 'react'
import { Form } from 'semantic-ui-react'

import { ClearableItem } from './ClearableItem'
import { DropdownItem } from './DropdownItem'

export const ProgrammeDropdown = ({ options, label, name, onChange, onClear, value, ...props }) => (
  <Form.Dropdown
    fluid
    label={label}
    multiple
    name={name}
    onChange={onChange}
    options={orderBy(options, ['size'], ['desc']).map(({ key, size, value, text, description }) => ({
      key,
      content: <DropdownItem code={key} description={description} name={text} size={size} />,
      text: !onClear ? text : <ClearableItem name={text} onClear={onClear} />,
      value,
    }))}
    search
    selection
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
