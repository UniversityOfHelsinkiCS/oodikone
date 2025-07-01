import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'

export const PanelView = ({ panels: initialPanels }) => {
  const [activeIndex, setActiveIndex] = useState<number[]>([])

  const togglePanel = (index: number) => {
    const currentActiveIndex = new Set(activeIndex)
    if (!currentActiveIndex.delete(index)) currentActiveIndex.add(index)

    setActiveIndex([...currentActiveIndex])
  }

  const availablePanels = useMemo(() => initialPanels.filter(panel => !!panel), [initialPanels])

  const panels = useMemo(
    () =>
      availablePanels.map((panel, index) => ({
        key: `${panel.title}-${index}`,
        title: panel.title,
        content: activeIndex.includes(index) && <div key={panel.key}>{panel.content}</div>,
        onChange: () => togglePanel(index),
      })),
    [availablePanels, activeIndex]
  )

  return (
    <Box data-cy="panelview-parent">
      {panels.map(({ key, onChange, title, content }) => (
        <Accordion
          disableGutters
          key={key}
          onChange={onChange}
          slotProps={{ transition: { unmountOnExit: true } }}
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
            <Typography component="span" data-cy={title} sx={{ fontSize: 'large', fontWeight: 'bold' }} variant="h6">
              {title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails data-cy={`${title}-data`}>{content}</AccordionDetails>
        </Accordion>
      ))}
    </Box>
  )
}
