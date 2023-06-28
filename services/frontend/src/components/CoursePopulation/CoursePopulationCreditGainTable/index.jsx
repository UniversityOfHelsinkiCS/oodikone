import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { shape, arrayOf, string, number } from 'prop-types'
import { Table, Tab } from 'semantic-ui-react'
import { maxBy } from 'lodash'
import InfoBox from '../../Info/InfoBox'
import infotooltips from '../../../common/InfoToolTips'
import { getNewestProgramme } from '../../../common'
import useLanguage from '../../LanguagePicker/useLanguage'

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

const CreditGainTable = ({ data, selectedStudents, totalCredits, headerText }) => {
  const tableRows = Object.keys(data)
    .sort()
    .map(code => <CreditGainTableRow key={code} statistics={data[code]} code={code} />)
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
          <Table.Cell style={{ fontWeight: '700' }}>{selectedStudents.length}</Table.Cell>
          <Table.Cell style={{ fontWeight: '700' }}>{totalCredits}</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  )
}

const CoursePopulationCreditGainTable = ({
  samples,
  selectedStudents,
  codes,
  from,
  to,
  studentToTargetCourseDateMap,
  populationStatistics,
  faculties,
}) => {
  const [programmeCreditsStatistics, setStatistics] = useState({})
  const [facultyCreditsStatistics, setFacStatistics] = useState({})
  const [totalCredits, setTotalCredits] = useState(0)
  useEffect(() => {
    if (samples && selectedStudents && Object.keys(populationStatistics).length > 0) {
      const programmeCredits = {}
      const facultyCredits = {}

      let tempTotal = 0
      const filteredStudents = samples.filter(student => selectedStudents.includes(student.studentNumber))
      filteredStudents.forEach(student => {
        const courses = student.courses.filter(c => codes.includes(c.course_code))
        const programme = getNewestProgramme(
          student.studyrights,
          student.studentNumber,
          studentToTargetCourseDateMap,
          populationStatistics.elementdetails.data
        )

        if (!programmeCredits[programme.code]) {
          programmeCredits[programme.code] = { name: programme.name, students: [], credits: 0 }
        }

        const faculty = faculties.find(fac => fac.code === programme.facultyCode) || {
          // in case there isn't a faculty associated with studyright
          code: '0000',
          name: { fi: 'No associated faculty' },
        }

        if (!facultyCredits[faculty.code]) {
          facultyCredits[faculty.code] = { name: faculty.name, students: [], credits: 0 }
        }

        programmeCredits[programme.code].students.push(student.studentNumber)
        facultyCredits[faculty.code].students.push(student.studentNumber)
        const coursesBetween = []
        courses.forEach(course => {
          if (
            new Date(from).getTime() <= new Date(course.date).getTime() &&
            new Date(course.date).getTime() <= new Date(to).getTime() &&
            course.passed
          ) {
            if (course.grade === 'Hyv.') {
              coursesBetween.push({ grade: course.grade, value: 1, credits: course.credits })
            } else {
              coursesBetween.push({ grade: course.grade, value: Number(course.grade), credits: course.credits })
            }
          }
        })
        if (maxBy(coursesBetween, course => course.value)) {
          const maxCredits = maxBy(coursesBetween, course => course.value).credits
          programmeCredits[programme.code].credits += maxCredits
          facultyCredits[faculty.code].credits += maxCredits
          tempTotal += maxBy(coursesBetween, course => course.value).credits
        }
      })
      setTotalCredits(tempTotal)
      setStatistics(programmeCredits)
      setFacStatistics(facultyCredits)
    }
  }, [selectedStudents])

  const panes = [
    {
      menuItem: 'Faculty',
      render: () => (
        <Tab.Pane>
          <CreditGainTable
            data={facultyCreditsStatistics}
            selectedStudents={selectedStudents}
            totalCredits={totalCredits}
            headerText="Faculty"
          />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Programme',
      render: () => (
        <Tab.Pane>
          <CreditGainTable
            data={programmeCreditsStatistics}
            selectedStudents={selectedStudents}
            totalCredits={totalCredits}
            headerText="Programme"
          />
        </Tab.Pane>
      ),
    },
  ]

  return (
    <>
      <InfoBox content={infotooltips.PopulationStatistics.CreditDistributionCoursePopulation} />
      <Tab panes={panes} />
    </>
  )
}

CoursePopulationCreditGainTable.defaultProps = {
  studentToTargetCourseDateMap: null,
}

CreditGainTableRow.propTypes = {
  statistics: shape({}).isRequired,
  code: string.isRequired,
}

CreditGainTable.propTypes = {
  data: shape({}).isRequired,
  selectedStudents: arrayOf(string).isRequired,
  totalCredits: number.isRequired,
  headerText: string.isRequired,
}

CoursePopulationCreditGainTable.propTypes = {
  selectedStudents: arrayOf(string).isRequired,
  samples: arrayOf(shape({})).isRequired,
  codes: arrayOf(string).isRequired,
  from: number.isRequired,
  to: number.isRequired,
  studentToTargetCourseDateMap: shape({}),
  populationStatistics: shape({}).isRequired,
  faculties: arrayOf(shape({})).isRequired,
}

const mapStateToProps = ({ populations, faculties }) => {
  return {
    faculties: faculties.data,
    populationStatistics: populations.data,
  }
}

export default connect(mapStateToProps, null)(CoursePopulationCreditGainTable)
