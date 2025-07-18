import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Box from '@mui/material/Box'

import FormControlLabel from '@mui/material/FormControlLabel'
import Paper from '@mui/material/Paper'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { mean, groupBy } from 'lodash'
import { Fragment, useState } from 'react'

import { PercentageBar } from '@/components/material/PercentageBar'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { PopulationQuery } from '@/types/populationSearch'
import { getFullStudyProgrammeRights } from '@/util/access'
import { getAge } from '@/util/timeAndDate'

type AgeStatsProps = {
  filteredStudents: any[] // TODO: type
  query: PopulationQuery
}
export const AgeStats = ({ filteredStudents, query }: AgeStatsProps) => {
  const [isGrouped, setIsGrouped] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<number[]>([])
  const { fullAccessToStudentData, programmeRights } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const onlyIamRights = !fullAccessToStudentData && fullStudyProgrammeRights.length === 0

  const currentAges: number[] = filteredStudents.reduce((ages, student) => {
    ages.push(getAge(student.birthdate, false))
    return ages
  }, [])

  const getAges = (grouped: boolean) =>
    Object.entries(groupBy(currentAges, age => (grouped ? Math.floor(age / 5) * 5 : Math.floor(age))))
      .map(([age, arrayOfAges]) => [Number(age), arrayOfAges.length] as [number, number])
      .sort(([a], [b]) => b - a)

  const getAgeCellContent = (age: number) => {
    if (!isGrouped) return age
    if (age <= 15) return '< 20'
    return `${age}–${Number(age) + 4}`
  }

  const handleGroupExpand = (index: number) => {
    if (expandedGroups.includes(index)) {
      setExpandedGroups(expandedGroups.filter(value => value !== index))
    } else {
      setExpandedGroups(expandedGroups.concat(index))
    }
  }

  const averageAgeAtStudiesStart = mean(
    filteredStudents.reduce((ages, student) => {
      const studyRight = student.studyRights.find(sr => sr.studyRightElements.some(el => el.code === query.programme))
      if (studyRight) {
        const startDateInProgramme = studyRight.studyRightElements.find(el => el.code === query.programme).startDate
        ages.push(getAge(student.birthdate, false, new Date(startDateInProgramme)))
      }
      return ages
    }, [])
  ).toFixed(1)

  const currentAverageAge = mean(currentAges).toFixed(1)
  const total = filteredStudents.length

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        mt: '1em',
      }}
    >
      <Typography>
        Current average age: <b>{currentAverageAge}</b>
      </Typography>
      <Typography>
        Average age at studies start: <b>{averageAgeAtStudiesStart}</b>
      </Typography>
      {!onlyIamRights && (
        <FormControlLabel
          control={<Switch checked={isGrouped} onChange={() => setIsGrouped(prev => !prev)} />}
          label="Group ages"
          sx={{ mt: '0.5em' }}
        />
      )}
      <TableContainer component={Paper} sx={{ mt: '0.5em', maxWidth: 'min(95%, 60em)' }} variant="outlined">
        <Table data-cy="age-distribution-table">
          <TableHead>
            <TableRow>
              <TableCell>Current age</TableCell>
              <TableCell>
                Number of students <Typography fontWeight="250">(n={total})</Typography>
              </TableCell>
              <TableCell>Percentage of population</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {getAges(isGrouped).map(([age, count], index) => (
              <Fragment key={`${age}-fragment`}>
                <TableRow
                  key={age}
                  onClick={!onlyIamRights ? () => handleGroupExpand(index) : undefined}
                  sx={{ cursor: isGrouped && !onlyIamRights ? 'pointer' : undefined }}
                >
                  <TableCell>
                    <Box alignItems="center" display="flex" justifyContent="left">
                      {getAgeCellContent(age)}
                      {isGrouped &&
                        !onlyIamRights &&
                        (expandedGroups.includes(index) ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
                    </Box>
                  </TableCell>
                  <TableCell>{count}</TableCell>
                  <TableCell sx={{ width: '20em' }}>
                    <PercentageBar denominator={total} numerator={count} />
                  </TableCell>
                </TableRow>
                {isGrouped &&
                  expandedGroups.includes(index) &&
                  getAges(false)
                    .filter(([nonGroupedAge]) => Math.floor(nonGroupedAge / 5) * 5 === Number(age))
                    .map(([nonGroupedAge, nonGroupedAgeCount]) => {
                      return (
                        <TableRow key={nonGroupedAge} sx={{ backgroundColor: 'grey.300' }}>
                          <TableCell>{nonGroupedAge}</TableCell>
                          <TableCell>{nonGroupedAgeCount}</TableCell>
                          <TableCell>
                            <PercentageBar denominator={total} numerator={nonGroupedAgeCount} />
                          </TableCell>
                        </TableRow>
                      )
                    })}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
