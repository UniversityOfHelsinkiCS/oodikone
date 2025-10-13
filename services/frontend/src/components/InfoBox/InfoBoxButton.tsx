import InfoIcon from '@mui/icons-material/Info'
import Button from '@mui/material/Button'

interface InfoBoxButtonProps {
  cypress?: string
  toggleOpen?: () => void
}

export const InfoBoxButton = ({ cypress, toggleOpen }: InfoBoxButtonProps) => {
  return (
    <Button
      color="info"
      data-cy={cypress ? `${cypress}-open-info` : undefined}
      onClick={toggleOpen}
      startIcon={<InfoIcon />}
      variant="outlined"
    >
      Show Info
    </Button>
  )
}
