import { Icon, Loader } from 'semantic-ui-react'

interface UpdateStatusIconProps {
  stats: {
    isLoading: boolean
    isSuccess: boolean
    isError: boolean
  }
}

export const UpdateStatusIcon = ({ stats }: UpdateStatusIconProps) => {
  if (stats.isLoading) return <Loader active inline size="small" />
  if (stats.isSuccess) return <Icon color="green" name="check" />
  if (stats.isError) return <Icon color="red" name="close" />
  return null
}
