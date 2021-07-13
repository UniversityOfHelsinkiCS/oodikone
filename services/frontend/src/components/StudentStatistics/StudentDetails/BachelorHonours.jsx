import React, { useEffect, useState } from 'react'
import moment from 'moment'
import { shape, arrayOf, func } from 'prop-types'
import { connect } from 'react-redux'
import { Divider, Table, Label, Header } from 'semantic-ui-react'

import { getNewestProgramme, reformatDate } from '../../../common'
import { getMandatoryCourseModules } from '../../../redux/populationMandatoryCourses'

const bachelorCodes = [
  'KH50_001',
  'KH50_002',
  'KH50_003',
  'KH50_004',
  'KH50_005',
  'KH50_006',
  'KH50_007',
  'KH50_008',
  '00345'
]

const BachelorHonours = ({ student, programmes, getMandatoryCourseModulesDispatch, mandatoryModules, absentYears }) => {
  const [studentsModules, setModules] = useState([])
  const [otherModules, setOther] = useState([])
  const [studyStartDate, setStartDate] = useState('')
  const [honors, setHonors] = useState(false)
  const [render, setRender] = useState(false)
  const [graduated, setGraduated] = useState(false)
  const [inspection, setInspection] = useState(false)
  const [reason, setReason] = useState(null)

  useEffect(() => {
    if (programmes) {
      const bachelorStudyrights = student.studyrights.filter(sr => sr.extentcode === 1)
      const newestBachelorProgramme = getNewestProgramme(bachelorStudyrights, student.studentNumber, null, programmes)
      const studyrightWithNewestProgramme = bachelorStudyrights.find(sr =>
        sr.studyright_elements.map(srE => srE.code).includes(newestBachelorProgramme.code)
      )

      if (studyrightWithNewestProgramme) {
        setStartDate(moment(studyrightWithNewestProgramme.startdate))
        setGraduated(!!studyrightWithNewestProgramme.graduated)
      }
      // currently only for matlu
      const shouldRender = bachelorCodes.includes(newestBachelorProgramme.code)

      if (shouldRender) getMandatoryCourseModulesDispatch(newestBachelorProgramme.code)
      setRender(shouldRender)
    }
  }, [programmes])

  useEffect(() => {
    // very naive perus- and aineopinto filtering
    const basicAndIntermediateStudies = mandatoryModules
      .filter(mod => mod.name.fi.includes('perusopinnot') || mod.name.fi.includes('aineopinnot'))
      .map(mod => mod.code)
    const attainedModules = student.courses.filter(
      course => basicAndIntermediateStudies.includes(course.course_code) || bachelorCodes.includes(course.course_code)
    )

    let inTime = false
    const degree = attainedModules.find(mod => bachelorCodes.includes(mod.course_code))

    if (degree) {
      const graduationDate = moment(degree.date)
      const yearsForGraduation = moment.duration(graduationDate.diff(studyStartDate)).asYears()

      // calculate time student has been absent during bachelors degree
      const timeAbsent = absentYears.reduce((acc, curr) => {
        const start = moment(curr.startdate)
        const end = moment(curr.enddate)

        // if absent years are not in the degree start and end range return acc
        if (start < studyStartDate || start > graduationDate) return acc
        const diff = moment.duration(end.diff(start)).asYears()
        return acc + diff
      }, 0)
      // round because absent count too accurate i.e. if a person has been absent a whole year
      // timeAbsent = 0.99... or something similar < 1 so in the name of fairness round a bit.
      inTime = yearsForGraduation <= 3 + Math.round(timeAbsent * 10) / 10
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
        if (bachelorCodes.includes(mod.course_code)) pairedModules.push(mod)
      })

      const filterGrades = pairedModules.filter(
        mod => !bachelorCodes.includes(mod.course_code) && Number(mod.grade) > 3
      )

      const leftOutModules = attainedModules.filter(mod => !pairedModules.includes(mod))

      setHonors(filterGrades.length > 1 && inTime)

      if (!inTime) {
        setReason(degree ? 'Did not graduate in time' : 'Has not graduated')
      } else if (filterGrades.length <= 1) {
        setReason('Module grades too low')
      }

      setModules(pairedModules)
      setOther(leftOutModules)
      setInspection(leftOutModules.length > 0 || (graduated && pairedModules.length < 3))
    } else {
      const filterGrades = attainedModules.filter(
        mod => !bachelorCodes.includes(mod.course_code) && Number(mod.grade) > 3
      )

      setHonors(filterGrades.length > 1 && inTime)

      if (!inTime) {
        setReason(degree ? 'Did not graduate in time' : 'Has not graduated')
      } else if (filterGrades.length <= 1) {
        setReason('Module grades too low')
      }

      setModules(attainedModules)
      setInspection(inTime && graduated && attainedModules.length < 3)
    }
  }, [mandatoryModules])

  const dataRows = modules =>
    modules.map(mod => (
      <Table.Row key={mod.course_code}>
        <Table.Cell>{reformatDate(mod.date, 'DD.MM.YYYY')}</Table.Cell>
        <Table.Cell>
          {mod.course.name.fi} ({mod.course_code})
        </Table.Cell>
        <Table.Cell>{mod.grade}</Table.Cell>
      </Table.Row>
    ))

  const dataTable = data => (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Date</Table.HeaderCell>
          <Table.HeaderCell>Course</Table.HeaderCell>
          <Table.HeaderCell>Grade</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>{dataRows(data)}</Table.Body>
    </Table>
  )

  if (!render) return null

  return (
    <>
      <Divider horizontal style={{ padding: '20px' }}>
        <Header as="h4">Bachelor Honours</Header>
      </Divider>
      <Header as="h5">Qualified</Header>
      <Label
        tag
        content={honors ? 'Qualified for Honours' : 'Not qualified for Honours'}
        color={honors ? 'green' : 'red'}
      />
      {!honors && reason && <Label tag content={reason} color="red" />}
      {inspection && <Label tag content="Might need further inspection" color="blue" />}
      {studentsModules.length > 0 ? (
        <>
          <Header as="h4">Main modules</Header>
          {dataTable(studentsModules)}
        </>
      ) : null}
      {otherModules.length > 0 ? (
        <>
          <Header as="h4">Other modules</Header>
          {dataTable(otherModules)}
        </>
      ) : null}
    </>
  )
}

BachelorHonours.propTypes = {
  student: shape({}).isRequired,
  programmes: shape({}).isRequired,
  mandatoryModules: arrayOf(shape({})).isRequired,
  absentYears: arrayOf(shape({})).isRequired,
  getMandatoryCourseModulesDispatch: func.isRequired
}

const mapStateToProps = ({ populationMandatoryCourses }) => {
  return {
    mandatoryModules: populationMandatoryCourses.data || []
  }
}

export default connect(mapStateToProps, { getMandatoryCourseModulesDispatch: getMandatoryCourseModules })(
  BachelorHonours
)
