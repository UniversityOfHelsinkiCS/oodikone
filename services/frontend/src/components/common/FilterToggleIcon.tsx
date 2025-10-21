import FilterAltOutlinedIcon from '@mui/icons-material/FilterAlt'
import Button from '@mui/material/Button'
import { forwardRef } from 'react'

type FilterToggleIconProps = {
  isActive: boolean
  disabled?: true
  onClick: () => void
}

export const FilterToggleIcon = forwardRef<HTMLButtonElement, FilterToggleIconProps>(
  (props: FilterToggleIconProps, ref) => {
    const { isActive, ...rest } = props

    return (
      <Button {...rest} ref={ref} variant={isActive ? 'contained' : 'outlined'}>
        <FilterAltOutlinedIcon fontSize="small" />
      </Button>
    )
  }
)

FilterToggleIcon.displayName = 'OKFilterToggleIcon'
