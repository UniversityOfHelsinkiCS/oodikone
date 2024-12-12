import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from '@mui/material'

export const AccordionWrapper = ({ children, level }: { children: React.ReactNode; level: string }) => {
  return (
    <Accordion
      disableGutters
      sx={{
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        boxShadow: 'none',
        overflow: 'hidden',
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack alignItems="center" direction="row" justifyContent="space-between" width="100%">
          <Typography component="h3" variant="h5">
            {level}
          </Typography>
          <Typography sx={{ color: 'text.secondary' }} variant="body1">
            {level} level progress by starting year
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  )
}
