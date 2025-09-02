import { useState, useEffect } from 'react'
import { sisUrl, serviceProvider } from '@/conf'

export const useSisUrl = () => {
  const [runtimeConfiguredSisUrl, setRuntimeConfiguredSisUrl] = useState(sisUrl)

  useEffect(() => {
    if (serviceProvider === 'fd')
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

  return runtimeConfiguredSisUrl
}
