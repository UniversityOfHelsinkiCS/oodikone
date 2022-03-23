import React, { createContext, useContext, useState, useEffect } from 'react'
import { Icon, Card, Dropdown, Portal, Popup } from 'semantic-ui-react'

import './styles.css'

const FigureContext = createContext(null)

const Header = ({ children, actions, contextItems }) => {
  const { isFullscreen, setFullscreen } = useContext(FigureContext)

  return (
    <Card.Content style={{ flexGrow: 0, display: 'flex', alignItems: 'center', padding: '1em', height: '3.25em' }}>
      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{children}</div>
      <div style={{ flexGrow: 1 }} />
      <div style={{ marginRight: '1em' }}>{actions}</div>
      <Popup
        trigger={
          <Icon
            name={isFullscreen ? 'compress' : 'expand'}
            onClick={() => setFullscreen(!isFullscreen)}
            style={{ cursor: 'pointer', fontSize: '1.1rem', marginRight: '0.5em', position: 'relative', top: '-1px' }}
          />
        }
        on="hover"
        position="bottom"
      >
        Toggle Fullscreen
      </Popup>
      {contextItems && (
        <div>
          <Dropdown position="bottom center" direction="left" icon="ellipsis vertical">
            <Dropdown.Menu>
              {contextItems.map(({ label, onClick }) => (
                <Dropdown.Item onClick={onClick}>{label}</Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
      )}
    </Card.Content>
  )
}

const Content = ({ children, ...rest }) => {
  const { isFullscreen } = useContext(FigureContext)

  const style = {
    ...rest.style,
    overflow: 'auto',
  }

  if (isFullscreen) {
    style.maxHeight = 'initial'
  }

  return (
    <Card.Content {...rest} style={style}>
      {children}
    </Card.Content>
  )
}

const FigureContainer = ({ children, style }) => {
  const [isFullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add('figure-fullscreen')
    } else {
      document.body.classList.remove('figure-fullscreen')
    }

    return () => document.body.classList.remove('figure-fullscreen')
  }, [isFullscreen])

  return (
    <FigureContext.Provider value={{ isFullscreen, setFullscreen }}>
      <Card fluid style={{ overflow: 'hidden', maxHeight: '100%', ...style }}>
        {children}
      </Card>
      <Portal
        open={isFullscreen}
        onClose={() => setFullscreen(false)}
        style={{
          width: '100% !important',
          height: '100% !important',
        }}
      >
        <div style={{ inset: 0, position: 'absolute', zIndex: 9004, height: '100000vh' }}>
          <Card
            fluid
            style={{ position: 'sticky', margin: 0, inset: 0, height: '100vh', border: 'none', borderRadius: 0 }}
          >
            {isFullscreen && children}
          </Card>
        </div>
      </Portal>
    </FigureContext.Provider>
  )
}

FigureContainer.Header = Header
FigureContainer.Content = Content

export default FigureContainer
