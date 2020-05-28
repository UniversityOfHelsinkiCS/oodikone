import React from 'react'
import { Button, Icon } from 'semantic-ui-react'

export default ({ disabled, onClick }) => (
  <Button compact color="red" size="tiny" disabled={disabled} onClick={onClick}>
    <Icon name="close" />
    Clear
  </Button>
)
