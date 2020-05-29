import React from 'react'
import { bool, node } from 'prop-types'
import './sidebar.css'

/**
 * Sidebar is located to the side of the main bar and is where you can usually enjoy
 * your :minttu: in a far calmer atmosphere.
 *
 * Use this as a wrapper for the `Pusher` and `Pushable` components below.
 */
const Sidebar = ({ open, children, ...rest }) => (
  <div {...rest} id="oodi-sidebar" className={open ? 'sidebar-open' : null}>
    {children}
  </div>
)

Sidebar.propTypes = {
  open: bool.isRequired,
  children: node.isRequired
}

/**
 * Wrapper for `Sidebar` content.
 */
Sidebar.Pusher = ({ children, ...rest }) => (
  <div {...rest} className="pusher">
    {children}
  </div>
)

Sidebar.Pusher.propTypes = {
  children: node.isRequired
}

/**
 * Wrapper for acual view content, pushed away by an open sidebar.
 */
Sidebar.Pushable = ({ children, ...rest }) => (
  <div {...rest} className="pushable">
    {children}
  </div>
)

Sidebar.Pushable.propTypes = {
  children: node.isRequired
}

export default Sidebar
