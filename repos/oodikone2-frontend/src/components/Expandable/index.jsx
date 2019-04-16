import React from 'react'
import { Accordion } from 'semantic-ui-react'
import PropTypes from 'prop-types'

const Expandable = ({ children, title, ...props }) => (
  <Accordion
    panels={[{
      key: 'key',
      title,
      content: {
        content: children
      }
    }]}
    {...props}
  />
)

Expandable.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired
}

export default Expandable
