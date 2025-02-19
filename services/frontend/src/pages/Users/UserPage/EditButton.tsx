import { Check as CheckIcon, Edit as EditIcon } from '@mui/icons-material'
import { Button } from '@mui/material'

export const EditButton = ({ disabled, editing, onClick }: { disabled: boolean; editing: boolean; onClick: any }) => {
  return (
    <Button
      color={editing ? 'success' : 'primary'}
      disabled={disabled}
      endIcon={editing ? <CheckIcon /> : <EditIcon />}
      onClick={onClick}
    >
      {editing ? 'Save' : 'Edit'}
    </Button>
  )
}
