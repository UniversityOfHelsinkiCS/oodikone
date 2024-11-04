import { orderBy } from 'lodash'
import { Form } from 'semantic-ui-react'

import { DropdownItem } from './DropdownItem'

type Option = {
  description: string
  key: string
  name: string
  size: number
  students: string[]
  text: string
  value: string
}

interface ProgrammeDropdownProps {
  label: string
  name: string
  onChange: () => void
  options: Option[]
  placeholder?: string
  value: string[]
}

export const ProgrammeDropdown = ({ label, name, onChange, options, placeholder, value }: ProgrammeDropdownProps) => {
  return (
    <Form.Dropdown
      fluid
      label={label}
      multiple
      name={name}
      onChange={onChange}
      options={orderBy(options, ['size'], ['desc']).map(option => ({
        key: option.key,
        content: (
          <DropdownItem code={option.key} description={option.description} name={option.text} size={option.size} />
        ),
        text: option.text,
        value: option.value,
      }))}
      placeholder={placeholder}
      search
      selectOnBlur={false}
      selectOnNavigation={false}
      selection
      value={value}
    />
  )
}
