import Accordion, { AccordionProps } from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary, { AccordionSummaryProps, accordionSummaryClasses } from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import {
  buildViewUrl,
  parseViewPath,
  VIEW_QUERY_PARAM,
  ViewScope,
  ViewScopeContext,
} from '@/components/common/viewPath'
import { CopyLinkButton } from '@/components/Section/CopyLinkButton'
import { toSectionSlug } from '@/components/Section/sectionLink'
import { KeyboardArrowRightIcon } from '@/theme'
import { useParseQueryParams } from '@/util/queryparams'

const PanelViewAccordion = styled(
  forwardRef<HTMLDivElement, AccordionProps>((props, ref) => (
    <Accordion disableGutters elevation={0} ref={ref} {...props} />
  ))
)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  '&:not(:last-child)': {
    borderBottom: 0,
  },
  '&::before': {
    display: 'none',
  },
}))

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

// Only the summary goes inside the heading, so screen readers don't announce the copy link button as part of it
const PanelHeader = styled('div')(({ theme }) => ({
  alignItems: 'center',
  display: 'flex',
  [`&:has(.${accordionSummaryClasses.focusVisible})`]: {
    backgroundColor: theme.palette.action.focus,
  },
  [`& .${accordionSummaryClasses.focusVisible}`]: {
    backgroundColor: 'transparent',
  },
}))

const HeaderClickArea = styled('div')({
  alignSelf: 'stretch',
  cursor: 'pointer',
  flexGrow: 1,
})

const NO_LINKED_PATH: string[] = []

const PanelScope = ({
  children,
  dropLink,
  linkedPath,
  panel,
  setCurrentTab,
}: ViewScope & { children: React.ReactNode }) => {
  const value = useMemo(
    () => ({ panel, linkedPath, setCurrentTab, dropLink }),
    [panel, linkedPath, setCurrentTab, dropLink]
  )
  return <ViewScopeContext.Provider value={value}>{children}</ViewScopeContext.Provider>
}

export type Panel = {
  title: string
  anchorId?: string
  content: React.ReactNode
}

export const PanelView = ({
  linkable = true,
  panels: initialPanels,
}: {
  /** Disable on pages whose state is not in the url (e.g. custom populations), since a link could not restore it */
  linkable?: boolean
  panels: (Panel | null | undefined | false)[]
}) => {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const params = useParseQueryParams()
  const viewParam = linkable ? params[VIEW_QUERY_PARAM]?.[0] : undefined
  const linkedPath = useMemo(() => parseViewPath(viewParam), [viewParam])
  const linkedSlug = linkedPath[0]
  const innerLinkedPath = useMemo(() => linkedPath.slice(1), [linkedPath])

  // Called on user interaction, so remounting the panel content or the page doesn't apply the link again
  const dropLink = useCallback(() => {
    const searchParams = new URLSearchParams(search)
    if (!searchParams.has(VIEW_QUERY_PARAM)) return
    searchParams.delete(VIEW_QUERY_PARAM)
    void navigate({ pathname, search: searchParams.toString() }, { replace: true })
  }, [navigate, pathname, search])

  const panels = initialPanels
    .filter((panel): panel is Panel => !!panel)
    .map(panel => ({ ...panel, slug: panel.anchorId ?? toSectionSlug(panel.title) }))

  const slugs = panels.map(({ slug }) => slug)

  const linkedPanel = linkedSlug && slugs.includes(linkedSlug) ? linkedSlug : undefined

  // Open from the start, since scrolling to a collapsed panel stops short when the page isn't yet tall enough
  const [expanded, setExpanded] = useState<string[]>(() => (linkedPanel ? [linkedPanel] : []))

  const linkedPanelRef = useRef<HTMLDivElement>(null)
  const hasScrolled = useRef(false)

  useEffect(() => {
    if (!linkedPanel || hasScrolled.current) return
    hasScrolled.current = true
    linkedPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [linkedPanel])

  const currentTabs = useRef<Record<string, string | undefined>>({})
  const setCurrentTab = useCallback((panel: string, segment: string | undefined) => {
    currentTabs.current[panel] = segment
  }, [])

  const togglePanel = (slug: string) => {
    setExpanded(current => (current.includes(slug) ? current.filter(s => s !== slug) : [...current, slug]))
    if (linkable) dropLink()
  }

  return (
    <Stack data-cy="panelview-parent">
      {panels.map(({ slug, title, content }) => {
        const isLinkTarget = slug === linkedSlug
        return (
          <PanelViewAccordion
            expanded={expanded.includes(slug)}
            id={slug}
            key={slug}
            onChange={() => togglePanel(slug)}
            ref={isLinkTarget ? linkedPanelRef : undefined}
            slots={{ heading: 'div' }}
            slotProps={{ transition: { unmountOnExit: true } }}
          >
            <PanelHeader>
              <Box component="h3" sx={{ flexGrow: linkable ? 0 : 1, font: 'inherit', m: 0 }}>
                <PanelSummary sx={linkable ? { pr: 0.5 } : undefined}>
                  <Typography data-cy={title} sx={{ fontSize: 'large', fontWeight: 'bold' }} variant="subtitle1">
                    {title}
                  </Typography>
                </PanelSummary>
              </Box>
              {linkable ? (
                <>
                  <CopyLinkButton
                    buildUrl={href =>
                      buildViewUrl(
                        href,
                        [slug, currentTabs.current[slug]].filter(s => s !== undefined)
                      )
                    }
                    cypress={slug}
                    target="panel"
                  />
                  <HeaderClickArea aria-hidden onClick={() => togglePanel(slug)} />
                </>
              ) : null}
            </PanelHeader>
            <AccordionDetails data-cy={`${title}-data`}>
              {linkable ? (
                <PanelScope
                  dropLink={dropLink}
                  linkedPath={isLinkTarget ? innerLinkedPath : NO_LINKED_PATH}
                  panel={slug}
                  setCurrentTab={setCurrentTab}
                >
                  {content}
                </PanelScope>
              ) : (
                content
              )}
            </AccordionDetails>
          </PanelViewAccordion>
        )
      })}
    </Stack>
  )
}
