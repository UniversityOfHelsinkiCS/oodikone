import Button from '@mui/material/Button'
import { CheckIcon, EditIcon } from '@/theme'

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
