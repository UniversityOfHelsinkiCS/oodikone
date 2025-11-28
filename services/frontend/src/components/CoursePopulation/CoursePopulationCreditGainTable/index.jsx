import Tab from '@mui/material/Tab'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import dayjs from 'dayjs'
import { maxBy } from 'lodash'
import { useState } from 'react'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { StyledTable } from '@/components/common/StyledTable'
import { findCorrectProgramme } from '@/components/CustomPopulation/CustomPopulationProgrammeDist/util'
import { InfoBox } from '@/components/InfoBox/InfoBox'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Loading } from '@/components/Loading'
import { useGetFacultiesQuery } from '@/redux/facultyStats'
import { useGetSemestersQuery } from '@/redux/semesters'

const CreditGainTableRow = ({ statistics, code }) => {
  const { getTextIn } = useLanguage()

  return (
    <TableRow key={code} value={statistics.students.length}>
      <TableCell>
        {code}, {getTextIn(statistics.name)}
      </TableCell>
      <TableCell>{statistics.students.length}</TableCell>
      <TableCell>{statistics.credits}</TableCell>
    </TableRow>
  )
}

const CreditGainTable = ({ data, totalCredits, headerText }) => {
  const tableRows = Object.keys(data)
    .sort()
    .map(code => {
      if (data[code].credits === 0) return null
      return <CreditGainTableRow code={code} key={code} statistics={data[code]} />
    })

  const totalStudents = Object.values(data).reduce((acc, code) => {
    if (code.credits === 0) return acc
    return acc + code.students.length
  }, 0)

  return (
    <StyledTable>
      <TableHead>
        <TableRow>
          <TableCell>{headerText}</TableCell>
          <TableCell>Students</TableCell>
          <TableCell>Credits</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {tableRows}
        <TableRow>
          <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
          <TableCell sx={{ fontWeight: 'bold' }}>{totalStudents}</TableCell>
          <TableCell sx={{ fontWeight: 'bold' }}>{totalCredits}</TableCell>
        </TableRow>
      </TableBody>
    </StyledTable>
  )
}

export const CoursePopulationCreditGainTable = ({ students, codes, from, to }) => {
  const [tab, setTab] = useState(0)

  const { data: faculties } = useGetFacultiesQuery()
  const { data: semesters } = useGetSemestersQuery()
  const { semesters: allSemesters, currentSemester } = semesters ?? { semesters: {}, currentSemester: null }
  const programmeCredits = {}
  const facultyCredits = {}

  if (!faculties || !currentSemester) {
    return <Loading />
  }

  let totalCredits = 0
  students.forEach(student => {
    const courses = student.courses.filter(course => codes.includes(course.course_code))
    const programme = findCorrectProgramme(student, codes, allSemesters, from, to, currentSemester) ?? {
      name: { en: 'No programme at the time of attainment', fi: 'Ei ohjelmaa suorituksen hetkellä' },
      code: '00000',
    }

    programmeCredits[programme.code] ??= { name: programme.name, students: [], credits: 0 }

    const faculty = faculties?.find(faculty => faculty.code === programme.facultyCode) ?? {
      // in case there isn't a faculty associated with studyright
      code: '0000',
      name: { en: 'No associated faculty', fi: 'Ei tiedekuntaa suorituksen hetkellä' },
    }

    facultyCredits[faculty.code] ??= { name: faculty.name, students: [], credits: 0 }

    const coursesBetween = []
    courses.forEach(course => {
      if (dayjs(course.date).isBetween(dayjs(from), dayjs(to)) && course.passed) {
        if (course.grade === 'Hyv.') {
          coursesBetween.push({ grade: course.grade, value: 1, credits: course.credits })
        } else {
          coursesBetween.push({ grade: course.grade, value: Number(course.grade), credits: course.credits })
        }
      }
    })
    if (maxBy(coursesBetween, course => course.value)) {
      programmeCredits[programme.code].students.push(student.studentNumber)
      facultyCredits[faculty.code].students.push(student.studentNumber)

      const maxCredits = maxBy(coursesBetween, course => course.value).credits
      programmeCredits[programme.code].credits += maxCredits
      facultyCredits[faculty.code].credits += maxCredits
      totalCredits += maxBy(coursesBetween, course => course.value).credits
    }
  })

  const panes = [
    {
      label: 'Faculty',
      render: () => <CreditGainTable data={facultyCredits} headerText="Faculty" totalCredits={totalCredits} />,
    },
    {
      label: 'Programme',
      render: () => <CreditGainTable data={programmeCredits} headerText="Programme" totalCredits={totalCredits} />,
    },
  ]

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <InfoBox content={populationStatisticsToolTips.creditDistributionCoursePopulation} />
      </div>
      <Tabs onChange={(_, newTab) => setTab(newTab)} value={tab}>
        {panes.map(({ label }) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>
      {panes.at(tab)?.render() ?? null}
    </>
  )
}
