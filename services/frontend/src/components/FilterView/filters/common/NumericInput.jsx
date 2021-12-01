import React from 'react'
import { Input, Label, Popup, Button, Icon } from 'semantic-ui-react'

const NumericInput = ({
  onChange,
  onKeyDown = () => {},
  onClear,
  value,
  label,
  clearButtonDisabled,
  className,
  name,
}) => (
  <Input
    labelPosition="left"
    size="mini"
    onChange={onChange}
    value={value}
    action
    onKeyDown={onKeyDown}
    className={className}
    data-cy={name}
  >
    <Label>{label}</Label>
    <input />
    <Popup
      content="Clear filter."
      position="left center"
      pinned
      size="mini"
      on="hover"
      trigger={
        <Button size="mini" color="red" icon onClick={onClear} disabled={clearButtonDisabled} data-cy={`${name}-clear`}>
          <Icon name="close" />
        </Button>
      }
    />
  </Input>
)

export default NumericInput
