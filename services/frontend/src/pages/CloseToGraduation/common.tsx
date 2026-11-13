import Box from '@mui/material/Box'

import { isFall } from '@/common'
import { CheckIcon } from '@/theme'
import { range } from '@oodikone/shared/util'

const NUMBER_OF_DISPLAYED_SEMESTERS = 6

export const getDisplayedSemestersStartYear = () =>
  new Date().getFullYear() - Math.floor(NUMBER_OF_DISPLAYED_SEMESTERS / 2)

export const getDisplayedSemesterCodes = (currentSemesterCode: number | undefined) => {
  if (currentSemesterCode == null) return []
  return isFall(currentSemesterCode)
    ? range(currentSemesterCode - NUMBER_OF_DISPLAYED_SEMESTERS + 2, currentSemesterCode + 2)
    : range(currentSemesterCode - NUMBER_OF_DISPLAYED_SEMESTERS + 1, currentSemesterCode + 1)
}

export const CheckIconWithTitle = ({ visible, title }: { visible: boolean; title?: string }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center' }} title={title}>
    {visible ? <CheckIcon color="success" fontSize="small" /> : <Box sx={{ width: '20px', height: '20px' }} />}
  </Box>
)
