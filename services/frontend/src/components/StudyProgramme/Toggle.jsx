import React from 'react'
import { Radio } from 'semantic-ui-react'

import WithHelpTooltip from '../Info/InfoWithHelpTooltip'

const Toggle = ({ cypress, toolTips, firstLabel, secondLabel, value, setValue }) => (
  <div className="radio-toggle">
    <label className={`toggle-label${value ? '-checked' : ''}`}>{firstLabel}</label>
    <Radio data-cy={cypress} toggle checked={value} onChange={() => setValue(!value)} />
    {toolTips ? (
      <WithHelpTooltip tooltip={{ short: toolTips }}>
        <label className={`toggle-label${value ? '' : '-checked'}`}>{secondLabel}</label>
      </WithHelpTooltip>
    ) : (
      <label className={`toggle-label${value ? '' : '-checked'}`}>{secondLabel}</label>
    )}
  </div>
)

export default Toggle
