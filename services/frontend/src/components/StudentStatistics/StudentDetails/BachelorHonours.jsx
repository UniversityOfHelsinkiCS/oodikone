import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { Divider, Table, Label, Header, Accordion, Icon } from 'semantic-ui-react'

import {
  bachelorHonoursProgrammes as bachelorCodes,
  bachelorHonoursBasicModules as basicHonoursModules,
  bachelorHonoursIntermediateModules as intermediateHonoursModules,
  reformatDate,
} from '@/common'
import { CurriculumPicker } from '@/components/PopulationDetails/CurriculumPicker'

export const BachelorHonours = ({ student, absentYears, programmeCode }) => {
  const [curriculum, setCurriculum] = useState(null)
  const [studentsModules, setModules] = useState([])
  const [otherModules, setOther] = useState([])
  const [showHonoursModules, setShowHonoursModules] = useState(false)
  const [studyStartDate, setStartDate] = useState('')
  const [honors, setHonors] = useState(false)
  const [graduated, setGraduated] = useState(false)
  const [inspection, setInspection] = useState(false)
  const [reason, setReason] = useState(null)
  const mandatoryModules = { defaultProgrammeResults: curriculum?.defaultProgrammeModules }

  useEffect(() => {
    if (programmeCode) {
      const bachelorStudyrights = student.studyrights.filter(studyright => studyright.extentcode === 1)
      const studyrightWithNewestProgramme = bachelorStudyrights.find(studyright =>
        studyright.studyright_elements.map(srE => srE.code).includes(programmeCode)
      )
      if (studyrightWithNewestProgramme) {
        setStartDate(moment(studyrightWithNewestProgramme.startdate))
        setGraduated(!!studyrightWithNewestProgramme.graduated)
      }
    }
  }, [programmeCode, student])

  useEffect(() => {
    if (!mandatoryModules?.defaultProgrammeResults?.length) return
    const mandatoryModuleCodes = mandatoryModules.defaultProgrammeResults
      ? mandatoryModules.defaultProgrammeResults.map(mod => mod.code)
      : []
    const degreeModule = student.courses.find(mod => bachelorCodes.includes(mod.course_code))
    const basicModules = student.courses.filter(mod => basicHonoursModules[programmeCode].includes(mod.course_code))
    const intermediateModules = student.courses.filter(mod =>
      intermediateHonoursModules[programmeCode].includes(mod.course_code)
    )

    let honoursModules = []
    if (degreeModule) honoursModules = [...honoursModules, degreeModule]
    if (basicModules.length) honoursModules = [...honoursModules, ...basicModules]
    if (intermediateModules.length) honoursModules = [...honoursModules, ...intermediateModules]
    const honoursModulesCodes = honoursModules?.map(mod => mod.course_code)

    setModules(honoursModules)
    setOther(
      student.courses.filter(
        c => !honoursModulesCodes.includes(c.course_code) && mandatoryModuleCodes.includes(c.course_code)
      )
    )

    let inTime = false

    if (degreeModule) {
      const graduationDate = moment(degreeModule.date)
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

    const allBasicUnderFour = basicModules.every(mod => Number(mod.grade) < 4)
    const basicAboveFour = basicModules.find(mod => Number(mod.grade) > 3)
    const allIntermediateUnderFour = intermediateModules.every(mod => Number(mod.grade) < 4)
    const intermediateAboveFour = intermediateModules.find(mod => Number(mod.grade) > 3)

    setHonors(basicAboveFour && intermediateAboveFour && inTime)

    if (!inTime) {
      setReason(degreeModule ? 'Did not graduate in time' : 'Has not graduated')
    } else if (inTime && graduated && honoursModules.length < 3 && honoursModules.length > 4) {
      setInspection(true)
    } else if (graduated && (allBasicUnderFour || allIntermediateUnderFour)) {
      setReason('Module grades too low')
    }
  }, [curriculum?.defaultProgrammeModules, student])

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

  if (!programmeCode || !student || !student.courses || !student.studyrights) return null

  return (
    <>
      <Divider horizontal style={{ padding: '20px' }}>
        <Header as="h4">Bachelor Honours</Header>
      </Divider>
      <Header as="h5">Qualified</Header>
      <Label
        color={honors ? 'green' : 'red'}
        content={honors ? 'Qualified for Honours' : 'Not qualified for Honours'}
        tag
      />
      {!honors && reason && <Label color="red" content={reason} tag />}
      {inspection && <Label color="blue" content="Might need further inspection" tag />}
      <div style={{ marginTop: '15px', marginBottom: '15px' }}>
        Select curriculum version used for checking Bachelor's Honour's eligibility
        <CurriculumPicker
          curriculum={curriculum}
          programmeCodes={[programmeCode]}
          setCurriculum={setCurriculum}
          year={new Date().getFullYear()}
        />
      </div>
      {honors ? (
        <Accordion>
          <Accordion.Title
            active={showHonoursModules}
            index={0}
            onClick={() => setShowHonoursModules(!showHonoursModules)}
          >
            <Header as="h4">
              <Icon name="dropdown" />
              Main courses and other modules
            </Header>
          </Accordion.Title>
          <Accordion.Content active={showHonoursModules}>
            <h4>Main Modules</h4>
            {studentsModules.length > 0 && dataTable(studentsModules)}
            <h4>Other Modules</h4>
            {otherModules.length > 0 && dataTable(otherModules)}
          </Accordion.Content>
        </Accordion>
      ) : null}
    </>
  )
}
