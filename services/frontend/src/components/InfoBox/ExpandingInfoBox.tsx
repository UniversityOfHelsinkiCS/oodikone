import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import { alpha, styled, Theme } from '@mui/material/styles'
import Tooltip from '@mui/material/Tooltip'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

import { useFormatContent } from '@/common'
import { HelpOutlineIcon } from '@/theme'

const ScrollArea = styled('div')({
  padding: 16,
  maxHeight: '100%',
  overflowY: 'auto',
  position: 'relative',
})

const BottomFade = styled('div')(({ theme }) => ({
  position: 'sticky',
  bottom: 0,
  height: 48,
  background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0)}, ${theme.palette.background.paper})`,
  pointerEvents: 'none',
}))

export const ExpandingInfoBox = ({
  content,
  cypress = '',
}: {
  content: string | ((theme: Theme) => string)
  cypress?: string
}) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Tooltip arrow title={'Paina avataksesi.'}>
        <Button
          color="info"
          data-cy={`${cypress}-info-box-button`}
          onClick={() => setOpen(true)}
          startIcon={<HelpOutlineIcon />}
          variant="contained"
        >
          Info
        </Button>
      </Tooltip>
      <Dialog fullWidth maxWidth="xl" onClose={() => setOpen(false)} open={open}>
        <ScrollArea>
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{useFormatContent(content)}</ReactMarkdown>
          <BottomFade />
        </ScrollArea>
      </Dialog>
    </>
  )
}
