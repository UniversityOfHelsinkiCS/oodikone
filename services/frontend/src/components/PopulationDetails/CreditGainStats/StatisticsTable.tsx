import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { getStudentTotalCredits } from '@/common'

const calculateMedian = (sortedArr: number[]) => {
  const mid = Math.floor(sortedArr.length / 2)
  return sortedArr.length % 2 !== 0 ? sortedArr[mid] : (sortedArr[mid - 1] + sortedArr[mid]) / 2
}

const calculateMean = (arr: number[]) => arr.reduce((acc, n) => acc + n, 0) / arr.length

export const StatisticsTable = ({ filteredStudents, type }: { filteredStudents: any[]; type: string }) => {
  if (!filteredStudents?.length) return null

  const credits: number[] = filteredStudents.map(student => getStudentTotalCredits(student)).sort((a, b) => a - b)

  const mean = calculateMean(credits)
  const median = calculateMedian(credits)
  const stdev = Math.sqrt(calculateMean(credits.map(credit => Math.pow(credit - mean, 2))))

  const minCredits = credits.at(0)
  const maxCredits = credits.at(-1)
  const sumCredits = credits.reduce((acc, n) => acc + n, 0)

  return (
    <TableContainer
      component={Paper}
      data-cy={`statistics-table-${type}`}
      sx={{
        flex: '1 1 22em',
        minWidth: '22em',
        maxWidth: '28em',
      }}
      variant="outlined"
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell colSpan={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                <Typography fontSize="1.6em" variant="h5">
                  {type}
                </Typography>
                <Typography data-cy="credit-stats-population-size" fontSize="1.2em" fontWeight="250">
                  (n = {credits.length})
                </Typography>
              </Box>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>
              <Typography fontWeight="500">Total credits</Typography>
            </TableCell>
            <TableCell data-cy="credit-stats-total">
              <Typography>{sumCredits.toFixed(2)}</Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <Typography fontWeight="500">Average</Typography>
            </TableCell>
            <TableCell data-cy="credit-stats-average">
              <Typography>{mean.toFixed(2)}</Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <Typography fontWeight="500">Median</Typography>
            </TableCell>
            <TableCell data-cy="credit-stats-median">
              <Typography>{median.toFixed(2)}</Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <Typography fontWeight="500">Standard deviation</Typography>
            </TableCell>
            <TableCell data-cy="credit-stats-stdev">
              <Typography>{stdev.toFixed(2)}</Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <Typography fontWeight="500">Minimum</Typography>
            </TableCell>
            <TableCell data-cy="credit-stats-min">
              <Typography>{minCredits}</Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <Typography fontWeight="500">Maximum</Typography>
            </TableCell>
            <TableCell data-cy="credit-stats-max">
              <Typography>{maxCredits}</Typography>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  )
}
