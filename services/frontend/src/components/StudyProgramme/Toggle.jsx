import ReactMarkdown from 'react-markdown'
import { Radio } from 'semantic-ui-react'

import { formatContent } from '@/common'
import { HoverableHelpPopup } from '@/components/common/HoverableHelpPopup'

export const Toggle = ({ cypress, firstLabel, secondLabel, setValue, toolTips, value }) => (
  <div className="radio-toggle">
    <label className={`toggle-label${value ? '-checked' : ''}`}>{firstLabel}</label>
    <Radio checked={value} data-cy={cypress} onChange={() => setValue(!value)} toggle />
    <label className={`toggle-label${value ? '' : '-checked'}`}>{secondLabel}</label>
    {toolTips && (
      <HoverableHelpPopup
        content={<ReactMarkdown>{formatContent(toolTips)}</ReactMarkdown>}
        style={{ marginLeft: '0.4em', color: '#888' }}
      />
    )}
  </div>
)
