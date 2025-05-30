import DownloadIcon from '@mui/icons-material/Download'
import Button from '@mui/material/Button'

export const ExportButton = ({
  cypress = '',
  disabled,
  onClick,
}: {
  cypress: string
  disabled: boolean
  onClick: () => void
}) => {
  return (
    <Button
      data-cy={`${cypress}-export-button`}
      disabled={disabled}
      onClick={onClick}
      startIcon={<DownloadIcon />}
      sx={{ backgroundColor: theme => theme.palette.export }}
      variant="contained"
    >
      Export
    </Button>
  )
}
