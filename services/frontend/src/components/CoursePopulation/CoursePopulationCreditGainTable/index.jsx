import { maxBy } from 'lodash'
import moment from 'moment'
import { Loader, Tab, Table } from 'semantic-ui-react'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { findCorrectProgramme } from '@/components/CustomPopulation/CustomPopulationProgrammeDist'
import { InfoBox } from '@/components/InfoBox'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useCurrentSemester } from '@/hooks/currentSemester'
import { useGetFacultiesQuery } from '@/redux/facultyStats'
import { useGetSemestersQuery } from '@/redux/semesters'

const CreditGainTableRow = ({ statistics, code }) => {
  const { getTextIn } = useLanguage()

  return (
    <Table.Row key={code} value={statistics.students.length}>
      <Table.Cell>
        {code}, {getTextIn(statistics.name)}
      </Table.Cell>
      <Table.Cell>{statistics.students.length}</Table.Cell>
      <Table.Cell>{statistics.credits}</Table.Cell>
    </Table.Row>
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
    <Table>
      <Table.Header style={{ backgroundColor: 'whitesmoke' }}>
        <Table.Row>
          <Table.HeaderCell>{headerText}</Table.HeaderCell>
          <Table.HeaderCell>Students</Table.HeaderCell>
          <Table.HeaderCell>Credits</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {tableRows}
        <Table.Row style={{ backgroundColor: 'ghostwhite' }}>
          <Table.Cell style={{ fontWeight: '700' }}>Total</Table.Cell>
          <Table.Cell style={{ fontWeight: '700' }}>{totalStudents}</Table.Cell>
          <Table.Cell style={{ fontWeight: '700' }}>{totalCredits}</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  )
}

export const CoursePopulationCreditGainTable = ({ students, codes, from, to }) => {
  const { data: faculties } = useGetFacultiesQuery()
  const { data: semesters } = useGetSemestersQuery()
  const currentSemester = useCurrentSemester()
  const programmeCredits = {}
  const facultyCredits = {}

  if (!faculties || !semesters || !currentSemester) {
    return (
      <Loader active inline="centered">
        Loading
      </Loader>
    )
  }

  let totalCredits = 0
  students.forEach(student => {
    const courses = student.courses.filter(course => codes.includes(course.course_code))
    const programme = findCorrectProgramme(student, codes, semesters, from, to, currentSemester) ?? {
      name: { en: 'No programme at the time of attainment', fi: 'Ei ohjelmaa suorituksen hetkellä' },
      code: '00000',
    }

    if (!programmeCredits[programme.code]) {
      programmeCredits[programme.code] = { name: programme.name, students: [], credits: 0 }
    }

    const faculty = faculties?.find(faculty => faculty.code === programme.facultyCode) || {
      // in case there isn't a faculty associated with studyright
      code: '0000',
      name: { en: 'No associated faculty', fi: 'Ei tiedekuntaa suorituksen hetkellä' },
    }

    if (!facultyCredits[faculty.code]) {
      facultyCredits[faculty.code] = { name: faculty.name, students: [], credits: 0 }
    }

    const coursesBetween = []
    courses.forEach(course => {
      if (moment(course.date).isBetween(moment(from), moment(to)) && course.passed) {
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
      menuItem: 'Faculty',
      render: () => (
        <Tab.Pane>
          <CreditGainTable data={facultyCredits} headerText="Faculty" totalCredits={totalCredits} />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Programme',
      render: () => (
        <Tab.Pane>
          <CreditGainTable data={programmeCredits} headerText="Programme" totalCredits={totalCredits} />
        </Tab.Pane>
      ),
    },
  ]

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <InfoBox content={populationStatisticsToolTips.creditDistributionCoursePopulation} />
      </div>
      <Tab panes={panes} />
    </>
  )
}
