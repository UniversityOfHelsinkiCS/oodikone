import React from 'react'
import PropTypes from 'prop-types'
import { Input, Label, Popup, Button, Icon } from 'semantic-ui-react'

const NumericInput = ({ onChange, onKeyDown, onClear, value, label, clearButtonDisabled }) => (
  <Input labelPosition="left" size="mini" onChange={onChange} value={value} action onKeyDown={onKeyDown}>
    <Label>{label}</Label>
    <input />
    <Popup
      content="Clear filter."
      position="bottom center"
      pinned
      size="mini"
      on="hover"
      trigger={
        <Button size="mini" color="red" icon onClick={onClear} disabled={clearButtonDisabled}>
          <Icon name="close" />
        </Button>
      }
    />
  </Input>
)

NumericInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  clearButtonDisabled: PropTypes.bool.isRequired
}

export default NumericInput
