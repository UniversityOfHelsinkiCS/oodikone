import Accordion, { AccordionProps } from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary, { AccordionSummaryProps, accordionSummaryClasses } from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'

import { KeyboardArrowRightIcon } from '@/theme'

const PanelViewAccordion = styled((props: AccordionProps) => <Accordion disableGutters elevation={0} {...props} />)(
  ({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    '&:not(:last-child)': {
      borderBottom: 0,
    },
    '&::before': {
      display: 'none',
    },
  })
)

const PanelSummary = styled((props: AccordionSummaryProps) => (
  <AccordionSummary expandIcon={<KeyboardArrowRightIcon />} {...props} />
))(({ theme }) => ({
  flexDirection: 'row-reverse',
  [`& .${accordionSummaryClasses.expandIconWrapper}.${accordionSummaryClasses.expanded}`]: {
    transform: 'rotate(90deg)',
  },
  [`& .${accordionSummaryClasses.content}`]: {
    marginLeft: theme.spacing(1),
  },
}))

export const PanelView = ({ panels: initialPanels }) => {
  const [activeIndex, setActiveIndex] = useState<number[]>([])

  const togglePanel = (index: number) => {
    const currentActiveIndex = new Set(activeIndex)
    if (!currentActiveIndex.delete(index)) currentActiveIndex.add(index)

    setActiveIndex([...currentActiveIndex])
  }

  // Remove this after each view is fixed to not include null along other panels
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
        <PanelViewAccordion
          expanded={!!content}
          key={key}
          onChange={onChange}
          slotProps={{ transition: { unmountOnExit: true } }}
        >
          <PanelSummary>
            <Typography data-cy={title} sx={{ fontSize: 'large', fontWeight: 'bold' }} variant="subtitle1">
              {title}
            </Typography>
          </PanelSummary>
          <AccordionDetails data-cy={`${title}-data`}>{content}</AccordionDetails>
        </PanelViewAccordion>
      ))}
    </Box>
  )
}
