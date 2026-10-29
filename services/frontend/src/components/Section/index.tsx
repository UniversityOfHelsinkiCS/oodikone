import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import type { SxProps, Theme } from '@mui/material/styles'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useEffect, useRef } from 'react'

import { InfoBox } from '@/components/InfoBox/InfoBoxWithTooltip'
import { ErrorMessage } from '@/components/Section/ErrorMessage'
import { ExportButton } from '@/components/Section/ExportButton'
import { LoadingSkeleton } from '@/components/Section/LoadingSkeleton'
import { buildSectionUrl, SECTION_QUERY_PARAM, toSectionSlug } from '@/components/Section/sectionLink'
import { useStatusNotification } from '@/components/StatusNotification/Context'
import { LinkIcon } from '@/theme'
import { useParseQueryParams } from '@/util/queryparams'

const CopySectionLinkButton = ({ cypress, slug }: { cypress: string; slug: string }) => {
  const { setStatusNotification, closeNotification } = useStatusNotification()

  const copyLinkToClipboard = async () => {
    await navigator.clipboard.writeText(buildSectionUrl(window.location.href, slug))
    setStatusNotification('Copied link to section')
    setTimeout(() => closeNotification(), 5000)
  }

  return (
    <Tooltip arrow title="Copy link to this section">
      <IconButton
        aria-label="Copy link to this section"
        data-cy={`${cypress}-copy-link-button`}
        onClick={() => void copyLinkToClipboard()}
        size="small"
      >
        <LinkIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  )
}

export const Section = ({
  anchorId,
  children,
  cypress = '',
  exportOnClick,
  infoBoxContent,
  isLoading = false,
  isError = false,
  title,
  contentSx = {},
  wrapperSx = {},
}: {
  /** Overrides the slug derived from `title`, used in `?section=<slug>` links. */
  anchorId?: string
  children: React.ReactNode
  cypress?: string
  exportOnClick?: () => void
  infoBoxContent?: string
  isLoading?: boolean
  isError?: boolean
  title?: string
  contentSx?: SxProps<Theme>
  wrapperSx?: SxProps<Theme>
}) => {
  const sectionRef = useRef<HTMLDivElement>(null)
  const hasScrolled = useRef(false)
  const params = useParseQueryParams()

  const slug = anchorId ?? (title ? toSectionSlug(title) : undefined)
  const isLinkTarget = !!slug && params[SECTION_QUERY_PARAM]?.[0] === slug

  useEffect(() => {
    if (!isLinkTarget || isLoading || hasScrolled.current) return
    hasScrolled.current = true
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [isLinkTarget, isLoading])

  const shouldRenderTopBar = !!title || !!exportOnClick || !!infoBoxContent
  return (
    <Paper
      data-cy={`${cypress}-section`}
      id={slug}
      ref={sectionRef}
      sx={{ padding: 2, ...(isLinkTarget ? { borderColor: 'primary.main' } : {}), ...wrapperSx }}
      variant="outlined"
    >
      {shouldRenderTopBar ? (
        <Stack alignItems="center" direction="row" justifyContent="space-between" sx={{ paddingBottom: 1 }}>
          <Stack alignItems="center" direction="row" gap={0.5}>
            <Typography component="h2" variant="h5">
              {title}
            </Typography>
            {title && slug ? <CopySectionLinkButton cypress={cypress} slug={slug} /> : null}
          </Stack>
          <Stack direction="row" gap={1}>
            {exportOnClick ? (
              <ExportButton cypress={cypress} disabled={isError || isLoading} onClick={exportOnClick} />
            ) : null}
            {infoBoxContent ? <InfoBox content={infoBoxContent} cypress={cypress} /> : null}
          </Stack>
        </Stack>
      ) : null}
      <Box sx={{ marginTop: title ? 2 : 0, ...contentSx }}>
        {isError ? <ErrorMessage /> : isLoading ? <LoadingSkeleton /> : children}
      </Box>
    </Paper>
  )
}
