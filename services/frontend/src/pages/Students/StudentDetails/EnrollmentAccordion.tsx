import { ArrowDropDown as ArrowForwardIosSharpIcon } from '@mui/icons-material'
import { AccordionDetails, AccordionSummary, Stack, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { useState } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { StyledAccordion } from '@/components/material/StyledAccordion'
import { StyledTable } from '@/components/material/StyledTable'
import { TableHeaderWithTooltip } from '@/components/material/TableHeaderWithTooltip'
import { getSemestersPresentFunctions } from '@/components/PopulationStudents/StudentTable/GeneralTab/columnHelpers/semestersPresent'
import { useGetSemestersQuery } from '@/redux/semesters'

const calculateSemesterEnrollmentsByStudyright = (semestersAndYears, studyrights) => {
  const { semesters, years } = semestersAndYears
  const programmeNames = {}
  let firstYear

  const studyRightsWithSemesterEnrollments = [
    ...studyrights.reduce((enrollments, studyRight) => {
      if (!studyRight.semesterEnrollments) return enrollments
      const { semesterEnrollments, id: studyRightId, studyRightElements } = studyRight

      enrollments.add(studyRightId)

      for (const enrollment of semesterEnrollments) {
        const year = years[semesters[enrollment.semester].yearcode]
        const enrollmentYear = new Date(year.startdate).getFullYear()
        if (!firstYear || enrollmentYear < firstYear) firstYear = enrollmentYear
      }

      programmeNames[studyRightId] = studyRightElements.map(element => element.name)

      return enrollments
    }, new Set()),
  ]

  return { studyRightsWithSemesterEnrollments, programmeNames, firstYear }
}

const getProgrammeEndDateForStudyright = (studyright, phase) => {
  const graduatedFromProgramme = studyright.studyRightElements.find(
    element => element.phase === phase && element.graduated
  )
  if (!graduatedFromProgramme) return null

  const { endDate, code: programmeCode } = graduatedFromProgramme
  return { endDate, programmeCode }
}

const processStudyrights = (studyrights, student, firstDisplayedYear, getTextIn, semestersAndYears) =>
  studyrights.reduce((acc, studyright) => {
    const studentToStudyrightEndMap = { [student.studentNumber]: null }
    const studentToSecondStudyrightEndMap = { [student.studentNumber]: null }

    const baseArguments = {
      allSemesters: Object.values(semestersAndYears.semesters),
      allSemestersMap: semestersAndYears.semesters,
      year: firstDisplayedYear,
      filteredStudents: [student],
      getTextIn,
      programmeCode: null,
    }

    const masterInfo = getProgrammeEndDateForStudyright(studyright, 2)
    if (masterInfo) {
      const { endDate, programmeCode } = masterInfo
      baseArguments.programmeCode = programmeCode
      studentToSecondStudyrightEndMap[student.studentNumber] = endDate
    }

    const bachelorInfo = getProgrammeEndDateForStudyright(studyright, 1)
    if (bachelorInfo) {
      const { endDate, programmeCode } = bachelorInfo
      baseArguments.programmeCode = programmeCode
      studentToStudyrightEndMap[student.studentNumber] = endDate
    }

    const { getSemesterEnrollmentsContent } = getSemestersPresentFunctions({
      ...baseArguments,
      studentToStudyrightEndMap,
      studentToSecondStudyrightEndMap,
      semestersToAddToStart: null,
    })

    acc[studyright.id] = getSemesterEnrollmentsContent(student, studyright)
    return acc
  }, {})

export const EnrollmentAccordion = ({ student }) => {
  const { data: semestersAndYears } = useGetSemestersQuery()
  const [active, setActive] = useState(false)
  const { getTextIn } = useLanguage()

  if (
    !semestersAndYears ||
    !student?.studyRights?.length ||
    !student.studyRights.some(studyRight => studyRight.semesterEnrollments)
  ) {
    return null
  }

  const { studyRights } = student

  const { studyRightsWithSemesterEnrollments, programmeNames, firstYear } = calculateSemesterEnrollmentsByStudyright(
    semestersAndYears,
    studyRights
  )

  const firstDisplayedYear = `${Math.max(new Date().getFullYear() - 10, firstYear)}`

  const semesterEnrollments = processStudyrights(studyRights, student, firstDisplayedYear, getTextIn, semestersAndYears)

  return (
    <StyledAccordion expanded={active} onChange={() => setActive(!active)}>
      <AccordionSummary expandIcon={<ArrowForwardIosSharpIcon />}>Enrollments</AccordionSummary>
      <AccordionDetails>
        <StyledTable showCellBorders sx={{ marginBottom: 1 }}>
          <TableHead>
            <TableRow>
              <TableCell>Programme(s)</TableCell>
              <TableCell>
                <TableHeaderWithTooltip
                  header={`Semesters (starting from autumn ${firstDisplayedYear})`}
                  tooltipText="Displays enrollment data for the current and up to nine previous academic years."
                />
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {studyRightsWithSemesterEnrollments.map(studyRightId => (
              <TableRow key={studyRightId}>
                <TableCell>
                  <Stack spacing={1}>
                    {programmeNames[studyRightId].map(getTextIn).map(element => (
                      <div key={element}>{element}</div>
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>{semesterEnrollments[studyRightId]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </StyledTable>
      </AccordionDetails>
    </StyledAccordion>
  )
}
