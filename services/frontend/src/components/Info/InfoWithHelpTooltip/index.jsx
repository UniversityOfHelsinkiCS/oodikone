import _ from 'lodash'
import React, { useRef, useState } from 'react'
import { Icon, Popup } from 'semantic-ui-react'

export const InfoWithHelpTooltip = ({ children, tooltip, containerStyle = {}, ...rest }) => {
  const popupContext = useRef()
  const [popupOpen, setPopupOpen] = useState(false)
  const [detailsOpen, setDetailsOPen] = useState(false)

  const trigger = (
    <div data-cy="tooltip-trigger" style={{ display: 'flex', ...containerStyle }}>
      {children}
      <div data-cy="popup-context" ref={popupContext} style={{ display: 'inline-block', cursor: 'help' }}>
        <Icon
          name="question circle outline"
          onClick={() => setPopupOpen(!popupOpen)}
          ref={popupContext}
          style={{ marginLeft: '0.5em', color: '#888' }}
        />
      </div>
    </div>
  )

  const popupProps = _.defaults(rest, {
    position: 'right center',
  })

  return (
    <Popup
      context={popupContext}
      hoverable
      mouseEnterDelay={2000}
      on="hover"
      onClose={() => {
        setPopupOpen(false)
        setDetailsOPen(false)
      }}
      onOpen={() => setPopupOpen(true)}
      open={popupOpen}
      size="tiny"
      trigger={trigger}
      wide={detailsOpen}
      {...popupProps}
    >
      <div>{tooltip.short}</div>
    </Popup>
  )
}
