import { Button, Icon } from 'semantic-ui-react'

interface InfoBoxButtonProps {
  cypress?: string
  toggleOpen?: () => void
}

export const InfoBoxButton = ({ cypress, toggleOpen }: InfoBoxButtonProps) => {
  return (
    <Button
      basic
      className="ok-infobox-collapsed"
      color="green"
      data-cy={cypress ? `${cypress}-open-info` : undefined}
      icon
      labelPosition="left"
      onClick={toggleOpen}
    >
      <Icon name="info circle" />
      Show Info
    </Button>
  )
}
