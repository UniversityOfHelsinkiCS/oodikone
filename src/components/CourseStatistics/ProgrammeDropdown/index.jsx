import React from 'react'
import { Form } from 'semantic-ui-react'
import { string, arrayOf, shape, func, oneOfType, number } from 'prop-types'

const ProgrammeDropdown = ({ options, label, name, onChange, value }) => (
  <Form.Dropdown
    options={options.map(({ key, size, value: v, text, ...rest }) => ({
        key,
        text,
        value: v,
        label: {
            icon: 'user',
            content: size,
            detail: key,
            size: 'tiny',
            basic: true
        },
        ...rest
    }))}
    selection
    fluid
    label={label}
    name={name}
    onChange={onChange}
    value={value}
  />
)
ProgrammeDropdown.propTypes = {
  label: string.isRequired,
  name: string.isRequired,
  onChange: func.isRequired,
  value: oneOfType([string, number]).isRequired,
  options: arrayOf(shape({
    code: oneOfType([string, number]),
    count: oneOfType([string, number]),
    value: oneOfType([string, number]),
    text: oneOfType([string, number]),
    size: oneOfType([string, number])
  })).isRequired
}

export default ProgrammeDropdown
