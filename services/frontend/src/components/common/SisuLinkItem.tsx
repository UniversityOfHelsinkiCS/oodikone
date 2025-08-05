import { Icon, Item } from 'semantic-ui-react'
import { sisUrl, serviceProvider } from '@/conf'

interface SisuLinkItemProps {
  id: string
}

//@ts-expect-error since frontendRuntimeConfiguredSisUrl is defined in a separate, possibly mounted js-file
const usableSisUrl = serviceProvider === 'fd' ? frontendRuntimeConfiguredSisUrl : sisUrl

export const SisuLinkItem = ({ id }: SisuLinkItemProps) => (
  <div data-cy="sisulink">
    <Item as="a" href={`${usableSisUrl}/tutor/role/staff/student/${id}/basic/basic-info`} target="_blank">
      <Icon name="external alternate" />
      Sisu
    </Item>
  </div>
)
