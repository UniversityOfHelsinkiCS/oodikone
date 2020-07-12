import React from 'react'
import PropTypes from 'prop-types'
import { Input, Label, Popup, Button, Icon } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getTranslate } from 'react-localize-redux'

const NumericInput = ({
  onChange,
  onKeyDown,
  onClear,
  value,
  label,
  clearButtonDisabled,
  className,
  translate,
  name
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
      content={translate('filters.numericFilterClearTooltip')}
      position="top right"
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
  translate: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired
}

NumericInput.defaultProps = {
  onKeyDown: () => {},
  className: null
}

const mapStateToProps = ({ localize }) => ({ translate: getTranslate(localize) })

export default connect(mapStateToProps)(NumericInput)
