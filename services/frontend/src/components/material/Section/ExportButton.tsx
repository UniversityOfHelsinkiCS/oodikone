import { Download as DownloadIcon } from '@mui/icons-material'
import { Button } from '@mui/material'

export const ExportButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Button
      onClick={onClick}
      startIcon={<DownloadIcon />}
      sx={{ backgroundColor: theme => theme.palette.export }}
      variant="contained"
    >
      Export
    </Button>
  )
}
