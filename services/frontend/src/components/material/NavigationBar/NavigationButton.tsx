import { Button } from '@mui/material'

export const NavigationButton = ({ item }) => {
  return (
    <Button key={item.key} sx={{ color: 'inherit', mx: 1 }}>
      {item.label}
    </Button>
  )
}
