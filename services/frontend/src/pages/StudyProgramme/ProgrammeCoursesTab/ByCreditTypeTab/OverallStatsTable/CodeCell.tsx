import { NorthEast as NorthEastIcon } from '@mui/icons-material'
import { IconButton, Stack, Typography } from '@mui/material'
import { Link } from 'react-router'

export const CodeCell = ({ code }: { code: string }) => {
  return (
    <Stack alignItems="center" direction="row" gap={1} justifyContent="space-between">
      <Typography variant="body2">{code}</Typography>
      <Link
        title={`Open course statistics for ${code}`}
        to={`/coursestatistics?courseCodes=["${encodeURIComponent(code)}"]&separate=false&unifyOpenUniCourses=false`}
      >
        <IconButton color="primary" data-cy={`${code.toLowerCase()}-course-statistics-link-button`}>
          <NorthEastIcon fontSize="small" />
        </IconButton>
      </Link>
    </Stack>
  )
}
