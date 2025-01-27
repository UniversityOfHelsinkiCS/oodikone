import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
} from '@mui/icons-material'
import { IconButton, TableCell, TableRow, Typography } from '@mui/material'
import { useState } from 'react'

import { formatPassRate } from '@/pages/CourseStatistics/courseStatisticsUtils'
import { AttemptData } from '@/types/attemptData'

const ContentCell = ({ content, obfuscated }: { content: string; obfuscated: boolean }) => {
  return (
    <TableCell align="right">
      <Typography color={obfuscated ? 'text.secondary' : 'text.primary'}>
        {obfuscated ? '5 or fewer students' : content}
      </Typography>
    </TableCell>
  )
}

export const FoldableRow = ({
  courseData,
  onClickCourse,
  userHasAccessToAllStats,
}: {
  courseData: AttemptData
  onClickCourse: (courseCode: string) => void
  userHasAccessToAllStats: boolean
}) => {
  const [isUnfolded, setIsUnfolded] = useState(true)
  const { id, category, realisations } = courseData

  const hasRealisations = realisations.length && realisations.length > 0
  const showCourseRealisations = hasRealisations && isUnfolded

  const getRow = (rowId: string, rowData: any, isMainRow = true) => {
    const { passed, failed, passrate, realisation, obfuscated } = rowData
    const showFoldIcon = isMainRow && hasRealisations
    return (
      <TableRow
        key={rowId}
        sx={{
          backgroundColor: isMainRow ? theme => theme.palette.grey[50] : '',
          '&:hover': {
            backgroundColor: theme => theme.palette.grey[100],
          },
        }}
      >
        <TableCell onClick={() => isMainRow && setIsUnfolded(isUnfolded => !isUnfolded)} width={1}>
          {showFoldIcon && (
            <IconButton size="small">{isUnfolded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}</IconButton>
          )}
        </TableCell>
        <TableCell align="left" onClick={() => onClickCourse(id)}>
          <Typography color={obfuscated ? 'text.secondary' : 'text.primary'} sx={{ cursor: 'pointer' }} variant="body2">
            {isMainRow ? (
              <>
                <Typography component="span" sx={{ fontWeight: 'bold' }} variant="body2">
                  {category}
                </Typography>
                {!userHasAccessToAllStats && <strong>*</strong>}{' '}
                <Typography component="span" sx={{ color: 'text.secondary' }} variant="body2">
                  {id}
                </Typography>
              </>
            ) : (
              <Typography component="span" variant="body2">
                {realisation}
              </Typography>
            )}
          </Typography>
        </TableCell>
        <ContentCell content={passed} obfuscated={obfuscated} />
        <ContentCell content={failed} obfuscated={obfuscated} />
        <ContentCell content={formatPassRate(passrate)} obfuscated={obfuscated} />
      </TableRow>
    )
  }

  return (
    <>
      {getRow(id, courseData)}
      {showCourseRealisations &&
        realisations.map(row => {
          const { realisation } = row
          const realisationId = `${id}-${realisation}`
          return getRow(realisationId, row, false)
        })}
    </>
  )
}
