import { useState, useEffect } from 'react'
import { Icon, Item } from 'semantic-ui-react'
import { sisUrl, serviceProvider } from '@/conf'

interface SisuLinkItemProps {
  id: string
}

export const SisuLinkItem = ({ id }: SisuLinkItemProps) => {
  const [runtimeConfiguredSisUrl, setRuntimeConfiguredSisUrl] = useState(sisUrl)
  useEffect(() => {
    fetch('/frontend-config.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Json response was not ok')
        }
        return response.json()
      })
      .then(data => {
        if (data.sisUrl) setRuntimeConfiguredSisUrl(data.sisUrl)
      })
      .catch(error => {
        throw new Error(error)
      })
  }, [])

  const usableSisUrl = serviceProvider === 'fd' ? runtimeConfiguredSisUrl : sisUrl

  return (
    <div data-cy="sisulink">
      <Item as="a" href={`${usableSisUrl}/tutor/role/staff/student/${id}/basic/basic-info`} target="_blank">
        <Icon name="external alternate" />
        Sisu
      </Item>
    </div>
  )
}
