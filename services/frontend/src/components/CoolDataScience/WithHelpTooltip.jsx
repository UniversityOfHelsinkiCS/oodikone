import React, { useRef, useState } from 'react'
import { Icon, Popup } from 'semantic-ui-react'
import _ from 'lodash'

export const WithHelpTooltip = ({ children, tooltip, onOpenDetails, iconStyle = {}, iconPosition = {}, ...rest }) => {
  const popupContext = useRef()
  const [popupOpen, setPopupOpen] = useState(false)

  const trigger = (
    <div>
      {children}
      <div
        ref={popupContext}
        style={{ marginLeft: '0.3em', display: 'inline-block', paddingTop: '0.2em', cursor: 'help', ...iconStyle }}
      >
        <Icon
          onClick={() => setPopupOpen(!popupOpen)}
          ref={popupContext}
          style={{ position: 'relative', color: '#888', ...iconPosition }}
          name="question circle outline"
        />
      </div>
    </div>
  )

  const popupProps = _.defaults(rest, {
    position: 'right center',
  })

  return (
    <Popup
      hoverable
      size="tiny"
      open={popupOpen}
      onOpen={() => setPopupOpen(true)}
      onClose={() => setPopupOpen(false)}
      trigger={trigger}
      context={popupContext}
      {...popupProps}
      on="hover"
      mouseEnterDelay={1000}
    >
      <div>{tooltip}</div>
      <span style={{ color: '#2185d0', cursor: 'pointer' }} onClick={onOpenDetails}>
        Lue lisää...
      </span>
    </Popup>
  )
}
