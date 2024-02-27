import _ from 'lodash'
import React, { useState, useRef } from 'react'
import { Popup, Icon } from 'semantic-ui-react'

export const InfoWithHelpTooltip = ({ children, tooltip, containerStyle = {}, ...rest }) => {
  const popupContext = useRef()
  const [popupOpen, setPopupOpen] = useState(false)
  const [detailsOpen, setDetailsOPen] = useState(false)

  const trigger = (
    <div style={{ display: 'flex', ...containerStyle }} data-cy="tooltip-trigger">
      {children}
      <div ref={popupContext} style={{ display: 'inline-block', cursor: 'help' }} data-cy="popup-context">
        <Icon
          onClick={() => setPopupOpen(!popupOpen)}
          ref={popupContext}
          style={{ marginLeft: '0.5em', color: '#888' }}
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
      wide={detailsOpen}
      hoverable
      size="tiny"
      open={popupOpen}
      onOpen={() => setPopupOpen(true)}
      onClose={() => {
        setPopupOpen(false)
        setDetailsOPen(false)
      }}
      trigger={trigger}
      context={popupContext}
      {...popupProps}
      on="hover"
      mouseEnterDelay={2000}
    >
      <div>{tooltip.short}</div>
    </Popup>
  )
}
