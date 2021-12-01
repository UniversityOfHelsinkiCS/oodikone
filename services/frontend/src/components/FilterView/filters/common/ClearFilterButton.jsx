import React from 'react'
import { Button, Icon } from 'semantic-ui-react'

const ClearFilterButton = ({ disabled, onClick, name }) => (
  <Button
    compact
    color="gray"
    size="mini"
    disabled={disabled}
    onClick={onClick}
    data-cy={`${name}-clear`}
    style={{ whiteSpace: 'nowrap' }}
  >
    <Icon name="close" />
    Clear
  </Button>
)

export default ClearFilterButton
