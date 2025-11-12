import Accordion from '@mui/material/Accordion'
import styled from '@mui/material/styles/styled'

export const StyledAccordion = styled(Accordion)(() => ({
  boxShadow: 'none',
  width: '100%',
  '&::before': {
    display: 'none',
  },
  '& .MuiAccordionSummary-root': {
    flexDirection: 'row-reverse',
    padding: 0,
    marginLeft: '-8px',
    '& .MuiAccordionSummary-expandIconWrapper': {
      transform: 'rotate(-90deg)',
      transition: 'transform 0.3s ease',
    },
    '&.Mui-expanded .MuiAccordionSummary-expandIconWrapper': {
      transform: 'rotate(0deg)',
    },
  },
  '& .MuiAccordionDetails-root': {
    padding: 0,
  },
}))

StyledAccordion.defaultProps = {
  disableGutters: true,
}
