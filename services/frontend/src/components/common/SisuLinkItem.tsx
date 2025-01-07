import { Icon, Item } from 'semantic-ui-react'
import { sisUrl } from '@/conf'

interface SisuLinkItemProps {
  id: string
}

export const SisuLinkItem = ({ id }: SisuLinkItemProps) => (
  <div data-cy="sisulink">
    <Item as="a" href={`${sisUrl}/tutor/role/staff/student/${id}/basic/basic-info`} target="_blank">
      <Icon name="external alternate" />
      Sisu
    </Item>
  </div>
)
