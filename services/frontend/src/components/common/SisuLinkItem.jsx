import React from 'react'
import { Item, Icon } from 'semantic-ui-react'
import sendEvent from 'common/sendEvent'

const SisuLinkItem = ({ id, view, tab }) => {
  const sendAnalytics = sendEvent[view] ?? sendEvent.common

  return (
    <div data-cy="sisulink">
      <Item
        as="a"
        href={`https://sisu.helsinki.fi/tutor/role/staff/student/${id}/basic/basic-info`}
        target="_blank"
        onClick={() => sendAnalytics('Student link to Sisu clicked', tab)}
      >
        <Icon name="external alternate" />
        Sisu
      </Item>
    </div>
  )
}

export default SisuLinkItem
