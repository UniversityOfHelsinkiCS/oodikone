import ClearIcon from '@mui/icons-material/Clear'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useEffect, useState } from 'react'
import { InfoBox } from '@/components/material/InfoBox'

import type { Filter } from '../createFilter'

const ConditionalInfoBox = ({ info }) => {
  return info ? <InfoBox content={info} mini /> : null
}

export const FilterCard = ({
  active,
  filter,
  children,
  onClear,
}: {
  active: boolean
  filter: Filter
  children: React.ReactNode
  onClear: () => void
}) => {
  const [opened, setOpened] = useState<boolean>(active)
  useEffect(() => setOpened(active), [active])

  const { info, key, title } = filter

  const handleOnClick = () => setOpened(state => !state)

  const iconStyle = {
    transition: 'transform 300ms',
    ...(opened ? { transform: 'rotate(90deg)' } : {}),
  }

  return (
    <Stack
      data-active={active}
      data-cy={`${key}-filter-card`}
      padding={0.5}
      spacing={Number(opened) * 1.2}
      sx={{ width: '100%' }}
    >
      <Box
        data-cy={`${key}-header`}
        sx={{ alignItems: 'center', justifyContent: 'center', cursor: 'pointer', display: 'inline-flex' }}
      >
        <IconButton onClick={handleOnClick} size="small" sx={iconStyle}>
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
            onClick={() => onClear()}
            sx={{
              color: theme => theme.palette.error.dark,
              m: '0 0.5',
              '&:hover': {
                color: theme => theme.palette.error.light,
              },
            }}
          />
        ) : null}
        <ConditionalInfoBox info={info} />
      </Box>
      <Collapse in={opened} sx={{ transition: '300ms' }}>
        <Paper sx={{ p: 1.5 }} variant="outlined">
          {children}
        </Paper>
      </Collapse>
    </Stack>
  )
}
