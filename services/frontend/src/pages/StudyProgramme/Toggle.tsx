import { Radio } from 'semantic-ui-react'

import { HoverableHelpPopup } from '@/components/common/HoverableHelpPopup'

interface ToggleProps {
  cypress?: string
  firstLabel: string
  secondLabel: string
  setValue: (value: boolean) => void
  toolTips?: string
  value: boolean
}

export const Toggle = ({ cypress, firstLabel, secondLabel, setValue, toolTips, value }: ToggleProps) => (
  <div className="radio-toggle">
    <label className={`toggle-label${value ? '-checked' : ''}`}>{firstLabel}</label>
    <Radio checked={value} data-cy={cypress} onChange={() => setValue(!value)} toggle />
    <label className={`toggle-label${value ? '' : '-checked'}`}>{secondLabel}</label>
    {toolTips && <HoverableHelpPopup content={toolTips} style={{ marginLeft: '0.4em', color: '#888' }} />}
  </div>
)
