import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

import { AttemptData } from '@/types/attemptData'
import { FoldableRow } from './FoldableRow'

export const AttemptsTable = ({
  data,
  onClickCourse,
  userHasAccessToAllStats,
}: {
  data: AttemptData[]
  onClickCourse: (courseCode: string) => void
  userHasAccessToAllStats: boolean
}) => {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell align="left">Course</TableCell>
            <TableCell align="right">Passed</TableCell>
            <TableCell align="right">Failed</TableCell>
            <TableCell align="right">Pass rate</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map(course => (
            <FoldableRow
              courseData={course}
              key={course.id}
              onClickCourse={onClickCourse}
              userHasAccessToAllStats={userHasAccessToAllStats}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
