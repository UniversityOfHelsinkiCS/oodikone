import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'

import { InfoBox } from '@/components/InfoBox/InfoBoxWithTooltip'
import { ClearIcon, KeyboardArrowRightIcon } from '@/theme'
import type { Filter, FilterOptions, FilterTrayProps } from '../createFilter'

export const FilterCard = <Options extends FilterOptions, Args, Precompute>({
  filter,
  props,
  onClear,
}: {
  filter: Filter<Options, Args, Precompute>
  props: FilterTrayProps<Options, Args, Precompute>
  onClear: () => void
}) => {
  const { render, isActive, info, key, title } = filter

  const active = isActive(props.options, undefined)
  const [opened, setOpened] = useState<boolean>(active)
  useEffect(() => setOpened(opened || active), [active])

  const handleOnClick = () => setOpened(state => !state)

  return (
    <Stack data-active={active} data-cy={`${key}-filter-card`} padding={0.5} spacing={Number(opened) * 1.2}>
      <Box
        data-cy={`${key}-header`}
        sx={{ alignItems: 'center', justifyContent: 'center', cursor: 'pointer', display: 'inline-flex' }}
      >
        <IconButton
          onClick={handleOnClick}
          size="small"
          sx={{
            transition: 'transform 300ms',
            ...(opened && { transform: 'rotate(90deg)' }),
          }}
        >
          <KeyboardArrowRightIcon />
        </IconButton>
        <Typography
          component="span"
          fontWeight="medium"
          onClick={handleOnClick}
          sx={{ flex: 1, whiteSpace: 'wrap' }}
          variant="subtitle1"
        >
          {title}
        </Typography>
        {active ? (
          <ClearIcon
            data-cy={`${key}-clear`}
            onClick={onClear}
            sx={{
              color: theme => theme.palette.error.dark,
              m: '0 0.5',
              '&:hover': {
                color: theme => theme.palette.error.light,
              },
            }}
          />
        ) : null}
        {!!info && <InfoBox content={info} mini />}
      </Box>
      <Collapse in={opened} sx={{ transition: '300ms' }}>
        <Paper sx={{ p: 1.5 }} variant="outlined">
          {render(props)}
        </Paper>
      </Collapse>
    </Stack>
  )
}
