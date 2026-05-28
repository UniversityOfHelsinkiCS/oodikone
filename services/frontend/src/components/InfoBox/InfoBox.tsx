import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

import { useFormatContent } from '@/common'
import { InfoBoxButton } from './InfoBoxButton'

interface InfoBoxProps {
  content: string
  cypress?: string
}

/**
 * Click to open InfoBox.
 * For the hover variant, refer to ./InfoBoxWithTooltip.tsx.
 */
// eslint-disable-next-line import-x/no-unused-modules
export const InfoBox = ({ content, cypress = '' }: InfoBoxProps) => {
  const [open, setOpen] = useState(false)
  const toggleOpen = () => setOpen(prev => !prev)

  const md = useFormatContent(content)

  if (open) {
    return (
      <Alert icon={false} severity="info" variant="outlined">
        <ReactMarkdown>{md}</ReactMarkdown>
        <Button color="info" data-cy={`${cypress}-close-info`} fullWidth onClick={toggleOpen} variant="outlined">
          Close Info
        </Button>
      </Alert>
    )
  }

  return <InfoBoxButton cypress={cypress} toggleOpen={toggleOpen} />
}
