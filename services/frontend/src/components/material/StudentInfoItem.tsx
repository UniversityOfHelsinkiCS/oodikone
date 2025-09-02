import PersonIcon from '@mui/icons-material/Person'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useState, useEffect } from 'react'
import { Link } from 'react-router'

import { sisUrl, serviceProvider } from '@/conf'
import { ExternalLink } from './ExternalLink'

export const StudentInfoItem = ({ sisPersonId, studentNumber }: { sisPersonId: string; studentNumber: string }) => {
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
    <Stack direction="row" justifyContent="space-between">
      <Typography component="span" sx={{ alignContent: 'center', padding: '0 0.25em' }} variant="body2">
        {studentNumber}
      </Typography>
      <IconButton component={Link} target="_blank" to={`/students/${studentNumber}`}>
        <PersonIcon color="primary" fontSize="small" />
      </IconButton>
      <ExternalLink href={`${usableSisUrl}/tutor/role/staff/student/${sisPersonId}/basic/basic-info`} text="Sisu" />
    </Stack>
  )
}
