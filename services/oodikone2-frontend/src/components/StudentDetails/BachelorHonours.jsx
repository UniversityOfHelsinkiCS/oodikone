import React, { useEffect, useState } from 'react'
import moment from 'moment'
import { shape, arrayOf, func } from 'prop-types'
import { connect } from 'react-redux'
import { Segment, Table, Label, Header } from 'semantic-ui-react'

import { getNewestProgramme, reformatDate } from '../../common'
import { getMandatoryCourseModules } from '../../redux/populationMandatoryCourses'

const BachelorHonours = ({ student, programmes, getMandatoryCourseModulesDispatch, mandatoryModules, absentYears }) => {
  const [studentsModules, setModules] = useState([])
  const [otherModules, setOther] = useState([])
  const [studyStartDate, setStartDate] = useState('')
  const [honors, setHonors] = useState(false)
  const [render, setRender] = useState(false)

  useEffect(() => {
    const bachelorStudyrights = student.studyrights.filter(sr => sr.extentcode === 1)
    const newestBachelorProgramme = getNewestProgramme(bachelorStudyrights, student.studentNumber, null, programmes)

    // currently only for matlu
    setStartDate(moment(newestBachelorProgramme.startdate))
    const shouldRender = [
      'KH50_001',
      'KH50_002',
      'KH50_003',
      'KH50_004',
      'KH50_005',
      'KH50_006',
      'KH50_007',
      'KH50_008'
    ].includes(newestBachelorProgramme.code)

    if (shouldRender) getMandatoryCourseModulesDispatch(newestBachelorProgramme.code)

    setRender(shouldRender)
  }, [])

  useEffect(() => {
    // very naive perus- and aineopinto filtering
    const basicAndIntermediateStudies = mandatoryModules
      .filter(mod => mod.name.fi.includes('perusopinnot') || mod.name.fi.includes('aineopinnot'))
      .map(mod => mod.code)
    const attainedModules = student.courses.filter(
      course => basicAndIntermediateStudies.includes(course.course_code) || course.course_code === '00345'
    )

    let inTime = false
    const degree = attainedModules.find(mod => mod.course_code === '00345')

    if (degree) {
      const graduationDate = moment(degree.date)
      const yearsForGraduation = moment.duration(graduationDate.diff(studyStartDate)).asYears()

      const timeAbsent = absentYears.reduce((acc, curr) => {
        const start = moment(curr.startdate)
        const end = moment(curr.enddate)

        if (start < studyStartDate || start > graduationDate) return acc
        const diff = moment.duration(end.diff(start)).asYears()
        return acc + diff
      }, 0)

      inTime = yearsForGraduation <= 3 + timeAbsent.toFixed(1)
    }

    if (attainedModules.length > 3) {
      // student needs only one basic and one intermediate studies package
      // so if there are more than two attained modules + bachelors
      // filter out the module that does not match
      const pairedModules = []
      attainedModules.forEach(mod => {
        const filtered = attainedModules.filter(
          mod2 => mod2.course_code.slice(4, mod.course_code.length) === mod.course_code.slice(4, mod.course_code.length)
        )
        if (filtered.length > 1) pairedModules.push(mod)
        if (mod.course_code === '00345') pairedModules.push(mod)
      })

      const filterGrades = pairedModules.filter(mod => mod.course_code !== '00345' && Number(mod.grade) > 3)

      const leftOutModules = attainedModules.filter(mod => !pairedModules.includes(mod))

      setHonors(filterGrades.length > 1 && inTime)
      setModules(pairedModules)
      setOther(leftOutModules)
    } else {
      const filterGrades = attainedModules.filter(mod => mod.course_code !== '00345' && Number(mod.grade) > 3)

      setHonors(filterGrades.length > 1 && inTime)
      setModules(attainedModules)
    }
  }, [mandatoryModules])

  const moduleRows = studentsModules.map(mod => (
    <Table.Row key={mod.course_code}>
      <Table.Cell>{reformatDate(mod.date, 'DD.MM.YYYY')}</Table.Cell>
      <Table.Cell>
        {mod.course.name.fi} ({mod.course_code})
      </Table.Cell>
      <Table.Cell>{mod.grade}</Table.Cell>
    </Table.Row>
  ))

  const otherModuleRows = otherModules.map(mod => (
    <Table.Row key={mod.course_code}>
      <Table.Cell>{reformatDate(mod.date, 'DD.MM.YYYY')}</Table.Cell>
      <Table.Cell>
        {mod.course.name.fi} ({mod.course_code})
      </Table.Cell>
      <Table.Cell>{mod.grade}</Table.Cell>
    </Table.Row>
  ))

  if (!render) return null

  return (
    <Segment>
      <Header>Bachelor Honours</Header>
      <Label tag content={honors ? 'Honours' : 'Not honours'} color={honors ? 'green' : 'red'} />
      {otherModules.length > 0 ? <Label tag content="Might need further inspection" color="blue" /> : null}
      {studentsModules.length > 0 ? (
        <>
          <Header as="h4">Main modules</Header>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Course</Table.HeaderCell>
                <Table.HeaderCell>Grade</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>{moduleRows}</Table.Body>
          </Table>
        </>
      ) : null}
      {otherModules.length > 0 ? (
        <>
          <Header as="h4">Other modules</Header>
          <Table>
            <Table.Header>
              <Table.Row></Table.Row>
              <Table.Row>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Course</Table.HeaderCell>
                <Table.HeaderCell>Grade</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>{otherModuleRows}</Table.Body>
          </Table>
        </>
      ) : null}
    </Segment>
  )
}

BachelorHonours.propTypes = {
  student: shape({}).isRequired,
  programmes: arrayOf(shape({})).isRequired,
  mandatoryModules: arrayOf(shape({})).isRequired,
  absentYears: arrayOf(shape({})).isRequired,
  getMandatoryCourseModulesDispatch: func.isRequired
}

const mapStateToProps = ({ populationMandatoryCourses }) => {
  return {
    mandatoryModules: populationMandatoryCourses.data || {}
  }
}

export default connect(
  mapStateToProps,
  { getMandatoryCourseModulesDispatch: getMandatoryCourseModules }
)(BachelorHonours)
