import Button from '@mui/material/Button'

import { DownloadIcon } from '@/theme'

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
      color="primary"
      data-cy={`${cypress}-export-button`}
      disabled={disabled}
      onClick={onClick}
      startIcon={<DownloadIcon />}
      variant="contained"
    >
      Export
    </Button>
  )
}
