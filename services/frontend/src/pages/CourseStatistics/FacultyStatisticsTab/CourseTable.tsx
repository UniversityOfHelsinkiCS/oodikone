import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/material/Section'
import { CourseStat, FacultyStat } from '@/types/courseStat'

export const CourseTable = ({ course, courseInstance }: { course: CourseStat; courseInstance: FacultyStat }) => {
  const { getTextIn } = useLanguage()

  const rows = courseInstance ? (
    [
      ...Object.entries(courseInstance.faculties)
        .sort(([facultyCodeA], [facultyCodeB]) => facultyCodeA.localeCompare(facultyCodeB))
        .map(([facultyCode, instanceFaculty]) => (
          <TableRow key={`${course.coursecode}-${facultyCode}`}>
            <TableCell align="left">
              {facultyCode} • {getTextIn(instanceFaculty.name)}
            </TableCell>
            <TableCell align="right">{instanceFaculty.students.length}</TableCell>
            <TableCell align="right">{instanceFaculty.credits}</TableCell>
          </TableRow>
        )),
      <TableRow key={`${course.coursecode}-total`} sx={{ backgroundColor: theme => theme.palette.grey[50] }}>
        <TableCell align="left" sx={{ fontWeight: 'bold' }}>
          Total
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
          {courseInstance.allStudents.length}
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
          {courseInstance.allCredits}
        </TableCell>
      </TableRow>,
    ]
  ) : (
    <TableRow>
      <TableCell>
        <Typography color="text.secondary" variant="body2">
          No data for the selected academic year
        </Typography>
      </TableCell>
    </TableRow>
  )

  return (
    <Section title={`${getTextIn(course.name)} (${course.coursecode})`}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="left">Faculty</TableCell>
              <TableCell align="right">Students</TableCell>
              <TableCell align="right">Credits</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{rows}</TableBody>
        </Table>
      </TableContainer>
    </Section>
  )
}
