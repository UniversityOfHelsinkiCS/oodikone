import React from 'react'
import { Item, Icon } from 'semantic-ui-react'

const SisuLinkItem = ({ id }) => {
  return (
    <div data-cy="sisulink">
      <Item as="a" href={`https://sisu.helsinki.fi/tutor/role/staff/student/${id}/basic/basic-info`} target="_blank">
        <Icon name="external alternate" />
        Sisu
      </Item>
    </div>
  )
}

export default SisuLinkItem
