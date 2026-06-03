import Accordion, { AccordionProps } from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary, { AccordionSummaryProps, accordionSummaryClasses } from '@mui/material/AccordionSummary'
import Stack from '@mui/material/Stack'
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

  const panels = useMemo(
    () =>
      initialPanels.filter(Boolean).map((panel, index) => ({
        key: `${panel.title}-${index}`,
        title: panel.title,
        content: <div key={panel.key}>{panel.content}</div>,
        onChange: () => togglePanel(index),
        index,
      })),
    [initialPanels, activeIndex]
  )

  return (
    <Stack data-cy="panelview-parent">
      {panels.map(({ key, index, onChange, title, content }) => (
        <PanelViewAccordion
          expanded={activeIndex.includes(index)}
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
    </Stack>
  )
}
