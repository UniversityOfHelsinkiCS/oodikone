import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { Link } from '@/components/common/Link'
import { NorthEastIcon } from '@/theme'

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
