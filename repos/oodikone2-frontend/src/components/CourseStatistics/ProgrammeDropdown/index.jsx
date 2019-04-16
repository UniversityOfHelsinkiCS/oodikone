import React from 'react'
import { Form } from 'semantic-ui-react'
import { string, arrayOf, shape, func, oneOfType, number } from 'prop-types'
import DropdownItem from './DropdownItem'
import ClearableItem from './ClearableItem'

const ProgrammeDropdown = ({ options, label, name, onChange, onClear, value, ...props }) => (
  <Form.Dropdown
    options={options.map(({ key, size, value: v, text, ...rest }) => ({
        key,
        content: <DropdownItem name={text} code={key} size={size} />,
        text: !onClear ? text : <ClearableItem name={text} onClear={onClear} />,
        value: v,
        ...rest
    }))}
    selection
    fluid
    label={label}
    name={name}
    onChange={onChange}
    value={value}
    {...props}
  />
)

ProgrammeDropdown.propTypes = {
  label: string.isRequired,
  name: string.isRequired,
  onChange: func.isRequired,
  onClear: func,
  value: oneOfType([string, number]),
  options: arrayOf(shape({
    code: oneOfType([string, number]),
    count: oneOfType([string, number]),
    value: oneOfType([string, number]),
    text: oneOfType([string, number]),
    size: oneOfType([string, number])
  })).isRequired
}

ProgrammeDropdown.defaultProps = {
  value: undefined,
  onClear: undefined
}

export default ProgrammeDropdown
