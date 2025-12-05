import Tab from '@mui/material/Tab'
import TableBody from '@mui/material/TableBody'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import dayjs from 'dayjs'
import { maxBy } from 'lodash'
import { useState } from 'react'

import { StyledCell } from '@/components/common/StyledCell'
import { StyledTable } from '@/components/common/StyledTable'
import { findCorrectProgramme } from '@/components/CustomPopulation/CustomPopulationProgrammeDist/util'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Loading } from '@/components/Loading'
import { useGetFacultiesQuery } from '@/redux/facultyStats'
import { useGetSemestersQuery } from '@/redux/semesters'
import { FormattedStudent, Name } from '@oodikone/shared/types'

type CreditGainObj = Record<string, { credits: number; name: Name; students: string[] }>

const CreditGainTable = ({
  data,
  totalCredits,
  totalStudents,
  headerText,
}: {
  data: CreditGainObj
  totalCredits: number
  totalStudents: number
  headerText: string
}) => {
  const { getTextIn } = useLanguage()

  return (
    <StyledTable showCellBorders sx={{ mt: 1 }}>
      <TableHead>
        <TableRow>
          <StyledCell bold>{headerText}</StyledCell>
          <StyledCell bold>Students</StyledCell>
          <StyledCell bold>Credits</StyledCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Object.entries(data)
          .sort()
          .map(([code, values]) => (
            <TableRow key={code}>
              <StyledCell text>
                {code} - {getTextIn(values.name)}
              </StyledCell>
              <StyledCell text>{values.students.length}</StyledCell>
              <StyledCell text>{values.credits}</StyledCell>
            </TableRow>
          ))}
        <TableRow>
          <StyledCell bold>Total</StyledCell>
          <StyledCell bold>{totalStudents}</StyledCell>
          <StyledCell bold>{totalCredits}</StyledCell>
        </TableRow>
      </TableBody>
    </StyledTable>
  )
}

export const CoursePopulationCreditGainTable = ({
  students,
  codes,
  from,
  to,
}: {
  students: FormattedStudent[]
  codes: string[]
  from: Date
  to: Date
}) => {
  const [tab, setTab] = useState(0)

  const { data: faculties } = useGetFacultiesQuery()
  const { data: semesters } = useGetSemestersQuery()
  const { semesters: allSemesters, currentSemester } = semesters ?? { semesters: {}, currentSemester: null }

  if (!faculties || !currentSemester) {
    return <Loading />
  }

  const programmeCredits: CreditGainObj = {}
  const facultyCredits: CreditGainObj = {}

  let totalCredits = 0
  let totalStudents = 0

  students.forEach(student => {
    const courses = student.courses.filter(course => codes.includes(course.course_code))

    const programme = findCorrectProgramme(student, codes, allSemesters, from, to, currentSemester.semestercode)
    const faculty = faculties.find(faculty => faculty.code === programme.facultyCode) ?? {
      code: '00000',
      name: { en: 'No associated faculty', fi: 'Ei tiedekuntaa' },
    }

    const coursesBetween: { grade: string; value: number; credits: number }[] = []
    courses.forEach(course => {
      if (dayjs(course.date).isBetween(dayjs(from), dayjs(to)) && course.passed) {
        if (course.grade === 'Hyv.') {
          coursesBetween.push({ grade: course.grade, value: 1, credits: course.credits })
        } else {
          coursesBetween.push({ grade: course.grade, value: Number(course.grade), credits: course.credits })
        }
      }
    })

    const bestAttainmentByValue = maxBy(coursesBetween, course => course.value)

    if (bestAttainmentByValue) {
      programmeCredits[programme.code] ??= { name: programme.name, students: [], credits: 0 }
      facultyCredits[faculty.code] ??= { name: faculty.name, students: [], credits: 0 }

      programmeCredits[programme.code].students.push(student.studentNumber)
      facultyCredits[faculty.code].students.push(student.studentNumber)

      const maxCredits = bestAttainmentByValue.credits
      programmeCredits[programme.code].credits += maxCredits
      facultyCredits[faculty.code].credits += maxCredits

      totalCredits += maxCredits
      totalStudents++
    }
  })

  const panes = [
    {
      label: 'By faculty',
      render: (
        <CreditGainTable
          data={facultyCredits}
          headerText="Faculty at the time of completion"
          totalCredits={totalCredits}
          totalStudents={totalStudents}
        />
      ),
    },
    {
      label: 'By programme',
      render: (
        <CreditGainTable
          data={programmeCredits}
          headerText="Programme at the time of completion"
          totalCredits={totalCredits}
          totalStudents={totalStudents}
        />
      ),
    },
  ]

  return (
    <>
      <Tabs onChange={(_, newTab) => setTab(newTab)} value={tab}>
        {panes.map(({ label }) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>
      {panes.at(tab)?.render ?? null}
    </>
  )
}
