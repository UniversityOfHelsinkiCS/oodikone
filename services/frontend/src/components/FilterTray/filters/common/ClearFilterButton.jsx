import React from 'react'
import { Button, Icon } from 'semantic-ui-react'

const ClearFilterButton = ({ disabled, onClick, name }) => (
  <Button compact color="red" size="tiny" disabled={disabled} onClick={onClick} data-cy={`${name}-clear`}>
    <Icon name="close" />
    Clear
  </Button>
)

export default ClearFilterButton
