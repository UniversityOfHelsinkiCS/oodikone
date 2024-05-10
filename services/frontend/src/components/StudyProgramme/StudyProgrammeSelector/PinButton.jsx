import React from 'react'
import { Button, Icon } from 'semantic-ui-react'

export const PinButton = ({ onClick, pinned, programmeCode }) => {
  const black = '#303030'
  const grey = '#c4c4c4'

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <Button
        icon
        onClick={() => {
          onClick({ programmeCode })
        }}
        style={{ background: 'none', padding: '5px' }}
      >
        <Icon name="pin" style={{ color: pinned ? black : grey }} />
      </Button>
    </div>
  )
}
