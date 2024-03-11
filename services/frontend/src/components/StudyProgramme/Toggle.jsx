import React from 'react'
import { Radio } from 'semantic-ui-react'

import { InfoWithHelpTooltip } from '@/components/Info/InfoWithHelpTooltip'

export const Toggle = ({ cypress, firstLabel, secondLabel, setValue, toolTips, value }) => (
  <div className="radio-toggle">
    <label className={`toggle-label${value ? '-checked' : ''}`}>{firstLabel}</label>
    <Radio data-cy={cypress} toggle checked={value} onChange={() => setValue(!value)} />
    {toolTips ? (
      <InfoWithHelpTooltip tooltip={{ short: toolTips }}>
        <label className={`toggle-label${value ? '' : '-checked'}`}>{secondLabel}</label>
      </InfoWithHelpTooltip>
    ) : (
      <label className={`toggle-label${value ? '' : '-checked'}`}>{secondLabel}</label>
    )}
  </div>
)
