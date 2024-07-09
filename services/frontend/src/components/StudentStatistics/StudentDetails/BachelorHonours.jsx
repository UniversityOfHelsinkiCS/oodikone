import moment from 'moment'
import { useState } from 'react'
import { Accordion, Divider, Header, Icon, Label, Table } from 'semantic-ui-react'

import {
  bachelorHonoursProgrammes as bachelorCodes,
  bachelorHonoursBasicModules as basicHonoursModules,
  bachelorHonoursIntermediateModules as intermediateHonoursModules,
} from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { CurriculumPicker } from '@/components/PopulationDetails/CurriculumPicker'
import { DISPLAY_DATE_FORMAT } from '@/constants/date'
import { reformatDate } from '@/util/timeAndDate'

export const BachelorHonours = ({ absentYears, programmeCode, student }) => {
  const [curriculum, setCurriculum] = useState(null)
  const [showHonoursModules, setShowHonoursModules] = useState(false)
  const { defaultProgrammeModules: mandatoryModules } = curriculum ?? {}
  const { getTextIn } = useLanguage()

  if (!student?.courses || !student?.studyRights) return null

  let studyStartDate
  let reason
  let graduated = false
  let inspection = false
  let inTime = false

  const studyRightWithCorrectProgramme = student.studyRights.find(studyRight =>
    studyRight.studyRightElements.some(element => element.code === programmeCode)
  )

  if (studyRightWithCorrectProgramme) {
    studyStartDate = moment(studyRightWithCorrectProgramme.startDate)
    graduated = !!studyRightWithCorrectProgramme.studyRightElements.find(element => element.code === programmeCode)
      .graduated
  }

  const mandatoryModuleCodes = mandatoryModules ? mandatoryModules.map(mod => mod.code).filter(Boolean) : []

  const degreeModule = student.courses.find(mod => bachelorCodes.includes(mod.course.code))
  const basicModules = student.courses.filter(mod => basicHonoursModules[programmeCode].includes(mod.course.code))
  const intermediateModules = student.courses.filter(mod =>
    intermediateHonoursModules[programmeCode].includes(mod.course.code)
  )

  const mainModules = []
  if (degreeModule) mainModules.push(degreeModule)
  if (basicModules.length) mainModules.push(...basicModules)
  if (intermediateModules.length) mainModules.push(...intermediateModules)
  const mainModuleCodes = mainModules.map(mod => mod.course.code)

  const otherModules = student.courses.filter(
    course => !mainModuleCodes.includes(course.course.code) && mandatoryModuleCodes.includes(course.course.code)
  )

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

  const basicAtLeastFour = basicModules.find(mod => Number(mod.grade) >= 4)
  const intermediateAtLeastFour = intermediateModules.find(mod => Number(mod.grade) >= 4)

  const honours = basicAtLeastFour && intermediateAtLeastFour && inTime

  if (!inTime) {
    reason = degreeModule ? 'Did not graduate in time' : 'Has not graduated'
  } else if (inTime && graduated && (mainModules.length < 3 || mainModules.length > 4)) {
    inspection = true
  } else if (graduated && !(basicAtLeastFour && intermediateAtLeastFour)) {
    reason = 'Module grades too low'
  }

  const dataRows = modules =>
    modules.map(mod => (
      <Table.Row key={mod.course.code}>
        <Table.Cell>{reformatDate(mod.date, DISPLAY_DATE_FORMAT)}</Table.Cell>
        <Table.Cell>
          {getTextIn(mod.course.name)} ({mod.course.code})
        </Table.Cell>
        <Table.Cell>{mod.grade}</Table.Cell>
      </Table.Row>
    ))

  const dataTable = data => (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Date</Table.HeaderCell>
          <Table.HeaderCell>Module</Table.HeaderCell>
          <Table.HeaderCell>Grade</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>{dataRows(data)}</Table.Body>
    </Table>
  )

  return (
    <>
      <Divider horizontal>
        <Header as="h4">Bachelor Honours</Header>
      </Divider>
      <Header as="h5">Qualified</Header>
      <Label
        color={honours ? 'green' : 'red'}
        content={honours ? 'Qualified for Honours' : 'Not qualified for Honours'}
        tag
      />
      {!honours && reason && <Label color="red" content={reason} tag />}
      {inspection && <Label color="blue" content="Might need further inspection" tag />}
      <div style={{ marginTop: '15px', marginBottom: '15px' }}>
        Select curriculum version used for checking Bachelor Honours eligibility
        <CurriculumPicker
          curriculum={curriculum}
          programmeCodes={[programmeCode]}
          setCurriculum={setCurriculum}
          year={new Date().getFullYear()}
        />
      </div>
      {honours ? (
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
            {mainModules.length > 0 && dataTable(mainModules)}
            <h4>Other Modules</h4>
            {otherModules.length > 0 && dataTable(otherModules)}
          </Accordion.Content>
        </Accordion>
      ) : null}
    </>
  )
}
