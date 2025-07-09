import ClearIcon from '@mui/icons-material/Clear'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { FC, useState } from 'react'

import { InfoBox } from '@/components/material/InfoBox'

import { FilterContext, FilterViewContextState } from '../../context'
import type { Filter } from '../createFilter'

export const FilterCard: FC<{
  filter: Filter
  options: FilterContext['options']
  children: ReturnType<Filter['render']>
  onClear: () => ReturnType<FilterViewContextState['resetFilter']>
}> = ({ filter, options, children, onClear }) => {
  const { info, key, title, isActive } = filter
  const active = isActive(options)

  const [opened, setOpened] = useState<boolean>(active)

  return (
    <Stack data-active={active} data-cy={`${key}-filter-card`} spacing={1.2} sx={{ width: '100%' }}>
      <Box
        data-cy={`${key}-header`}
        onClick={() => setOpened(state => !state)}
        sx={{ alignItems: 'center', justifyContent: 'center', cursor: 'pointer', display: 'inline-flex' }}
      >
        <IconButton size="small">{opened ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}</IconButton>
        <Typography component="span" fontWeight={500} sx={{ mr: 1, flex: 1, whiteSpace: 'wrap' }} variant="subtitle1">
          {title}
        </Typography>
        {active && (
          <ClearIcon
            onClick={event => {
              event.stopPropagation()
              onClear()
              setOpened(false)
            }}
            sx={{
              color: theme => theme.palette.error.dark,
              mr: info ? 0.5 : 0,
              '&:hover': {
                color: theme => theme.palette.error.light,
              },
            }}
          />
        )}
        {info && <InfoBox content={info} mini />}
      </Box>
      <Collapse in={opened}>
        <Box sx={{ p: 1, mb: 1 }}>{children}</Box>
      </Collapse>
    </Stack>
  )
}
