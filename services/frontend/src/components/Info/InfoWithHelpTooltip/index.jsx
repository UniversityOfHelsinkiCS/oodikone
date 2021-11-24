import React, { useState, useRef } from 'react'
import { Popup, Icon } from 'semantic-ui-react'
import _ from 'lodash'

const InfoWithHelpTooltip = ({ children, tooltip, ...rest }) => {
  const popupContext = useRef()
  const [popupOpen, setPopupOpen] = useState(false)
  const [detailsOpen, setDetailsOPen] = useState(false)

  const trigger = (
    <div style={{ display: 'flex' }} data-cy="tooltip-trigger">
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
    <>
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
        {!detailsOpen && (
          <>
            <div>{tooltip.label}</div>
            <span style={{ color: '#2185d0', cursor: 'pointer' }} onClick={() => setDetailsOPen(!detailsOpen)}>
              Lue lisää...
            </span>
          </>
        )}
        {detailsOpen && <span>{tooltip.short}</span>}
      </Popup>
    </>
  )
}

export default InfoWithHelpTooltip
