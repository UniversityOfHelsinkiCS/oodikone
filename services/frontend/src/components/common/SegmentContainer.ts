import Box from '@mui/material/Box'
import styled from '@mui/material/styles/styled'

export const SegmentContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  gap: '0.5rem',

  paddingTop: '1rem',
  marginLeft: 'auto',
  marginRight: 'auto',
  width: '100%',
  maxWidth: '82vw',

  alignItems: 'center',
  justifyContent: 'center',
}))
