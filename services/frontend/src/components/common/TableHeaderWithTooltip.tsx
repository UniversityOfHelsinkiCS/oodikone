import Stack from '@mui/material/Stack'

import { ReactNode } from 'react'
import { InfoBox } from '../InfoBox/InfoBoxWithTooltip'

export const TableHeaderWithTooltip = ({ header, tooltipText }: { header: ReactNode; tooltipText: string }) => (
  <Stack direction="row" spacing={1}>
    <span style={{ whiteSpace: 'wrap' }}>{header}</span>
    <InfoBox content={tooltipText} mini />
  </Stack>
)
