import { Icon, Item } from 'semantic-ui-react'
import { useSisUrl } from '@/hooks/useSisUrl'

interface SisuLinkItemProps {
  id: string
}

export const SisuLinkItem = ({ id }: SisuLinkItemProps) => {
  const usableSisUrl = useSisUrl()

  return (
    <div data-cy="sisulink">
      <Item as="a" href={`${usableSisUrl}/tutor/role/staff/student/${id}/basic/basic-info`} target="_blank">
        <Icon name="external alternate" />
        Sisu
      </Item>
    </div>
  )
}
