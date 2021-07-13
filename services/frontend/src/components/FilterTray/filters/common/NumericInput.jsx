import React from 'react'
import PropTypes from 'prop-types'
import { Input, Label, Popup, Button, Icon } from 'semantic-ui-react'

const NumericInput = ({ onChange, onKeyDown, onClear, value, label, clearButtonDisabled, className, name }) => (
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

NumericInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func,
  onClear: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  label: PropTypes.node.isRequired,
  clearButtonDisabled: PropTypes.bool.isRequired,
  className: PropTypes.string,
  name: PropTypes.string.isRequired
}

NumericInput.defaultProps = {
  onKeyDown: () => {},
  className: null
}

export default NumericInput
