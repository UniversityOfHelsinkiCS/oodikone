import { Portal } from 'semantic-ui-react'

export const FigureContainer = ({ children, isFullscreen }) => {
  return (
    <>
      <Portal open={isFullscreen}>
        <div style={{ position: 'fixed', zIndex: 3, top: 0, left: 0, bottom: 0, right: 0 }}>{children}</div>
      </Portal>
      {children}
    </>
  )
}
