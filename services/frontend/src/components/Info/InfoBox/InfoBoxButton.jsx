import React from 'react'
import { Button, Icon } from 'semantic-ui-react'

export const InfoBoxButton = ({ cypress, toggleOpen }) => {
  return (
    <Button
      basic
      className="ok-infobox-collapsed"
      color="green"
      data-cy={`${cypress}-open-info`}
      icon
      labelPosition="left"
      onClick={toggleOpen}
    >
      <Icon name="info circle" />
      Show Info
    </Button>
  )
}
