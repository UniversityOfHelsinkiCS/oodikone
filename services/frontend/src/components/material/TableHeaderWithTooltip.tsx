import { Stack } from '@mui/material'

import { InfoBox } from './InfoBox'

export const TableHeaderWithTooltip = ({ header, tooltipText }: { header: string; tooltipText: string }) => (
  <Stack direction="row" gap={1}>
    <span style={{ whiteSpace: 'wrap', minWidth: '80px' }}>{header}</span>
    <InfoBox content={tooltipText} mini />
  </Stack>
)