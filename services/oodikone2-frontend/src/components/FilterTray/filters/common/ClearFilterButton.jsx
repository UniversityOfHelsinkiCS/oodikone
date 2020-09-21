import React from 'react'
import PropTypes from 'prop-types'
import { Button, Icon } from 'semantic-ui-react'

const ClearFilterButton = ({ disabled, onClick, name }) => (
  <Button compact color="red" size="tiny" disabled={disabled} onClick={onClick} data-cy={`${name}-clear`}>
    <Icon name="close" />
    Clear
  </Button>
)

ClearFilterButton.propTypes = {
  disabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired
}

export default ClearFilterButton
