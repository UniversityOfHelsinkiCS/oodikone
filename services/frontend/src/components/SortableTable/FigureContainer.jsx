import React, { createContext, useContext, useState, useEffect } from 'react'
import { Icon, Card, Portal, Popup, Button } from 'semantic-ui-react'

import './style.css'

const FigureContext = createContext(null)

const Header = ({ children, actions, onClickExport }) => {
  const { isFullscreen, setFullscreen } = useContext(FigureContext)

  return (
    <Card.Content style={{ flexGrow: 0, display: 'flex', alignItems: 'center', padding: '1em', height: '3.25em' }}>
      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{children}</div>
      <div style={{ flexGrow: 1 }} />
      <div style={{ marginRight: '1em' }}>{actions}</div>
      <Button
        onClick={onClickExport}
        size="tiny"
        style={{ marginRight: '1em', paddingLeft: '1em', paddingRight: '1em' }}
      >
        <Icon name="save" />
        Export to Excel
      </Button>
      <Popup
        on="hover"
        position="bottom left"
        trigger={
          <Icon
            name={isFullscreen ? 'compress' : 'expand'}
            onClick={() => setFullscreen(!isFullscreen)}
            style={{ cursor: 'pointer', fontSize: '1.1rem', marginRight: '0.5em', position: 'relative', top: '-1px' }}
          />
        }
      >
        Toggle Fullscreen
      </Popup>
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

export const FigureContainer = ({ children, style }) => {
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
      {isFullscreen ? (
        <Portal open={isFullscreen}>
          <div style={{ inset: '70px 0px 0px 0px', position: 'absolute', zIndex: 3, height: '10000vh' }}>
            <Card fluid style={{ position: 'sticky', margin: 0, inset: 0, height: '100vh', zIndex: 2 }}>
              {children}
            </Card>
          </div>
        </Portal>
      ) : (
        <Card fluid style={style}>
          {children}
        </Card>
      )}
    </FigureContext.Provider>
  )
}

FigureContainer.Header = Header
FigureContainer.Content = Content
