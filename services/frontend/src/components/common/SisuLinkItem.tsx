import { Icon, Item } from 'semantic-ui-react'

interface SisuLinkItemProps {
  id: string
}

export const SisuLinkItem = ({ id }: SisuLinkItemProps) => (
  <div data-cy="sisulink">
    <Item as="a" href={`https://sisu.helsinki.fi/tutor/role/staff/student/${id}/basic/basic-info`} target="_blank">
      <Icon name="external alternate" />
      Sisu
    </Item>
  </div>
)
