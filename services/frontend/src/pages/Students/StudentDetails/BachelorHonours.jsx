import { ArrowDropDown as ArrowDropDownIcon, Close as CloseIcon, Done as DoneIcon } from '@mui/icons-material'
import {
  AccordionDetails,
  AccordionSummary,
  Chip,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import moment from 'moment'
import { useState } from 'react'

import {
  bachelorHonoursProgrammes as bachelorCodes,
  bachelorHonoursBasicModules as basicHonoursModules,
  bachelorHonoursIntermediateModules as intermediateHonoursModules,
} from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/material/Section'
import { StyledAccordion } from '@/components/material/StyledAccordion'
import { StyledTable } from '@/components/material/StyledTable'
import { CurriculumPicker } from '@/components/PopulationDetails/CurriculumPicker'
import { DISPLAY_DATE_FORMAT } from '@/constants/date'
import { reformatDate } from '@/util/timeAndDate'

const ModuleTable = ({ data, cypress, getTextIn }) => (
  <StyledTable data-cy={cypress}>
    <TableHead>
      <TableRow>
        <TableCell>Date</TableCell>
        <TableCell>Module</TableCell>
        <TableCell>Grade</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {data.map(module => (
        <TableRow key={module.course.code}>
          <TableCell>{reformatDate(module.date, DISPLAY_DATE_FORMAT)}</TableCell>
          <TableCell>
            {getTextIn(module.course.name)} ({module.course.code})
          </TableCell>
          <TableCell>{module.grade}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </StyledTable>
)

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

  return (
    <Section title="Bachelor Honours">
      <Typography component="h3" gutterBottom variant="h6">
        Qualified
      </Typography>
      <Stack direction="row" spacing={1}>
        <Chip
          color={honours ? 'success' : 'error'}
          data-cy={`honours-chip-${honours ? 'qualified' : 'not-qualified'}`}
          icon={honours ? <DoneIcon /> : <CloseIcon />}
          label={honours ? 'Qualified for Honours' : 'Not qualified for Honours'}
        />
        {!honours && reason && <Chip color="error" data-cy="honours-chip-error" label={reason} />}
        {inspection && <Chip color="info" data-cy="honours-chip-inspection" label="Might need further inspection" />}
      </Stack>
      <Stack alignItems="center" direction="row" spacing={1} sx={{ marginTop: 2 }}>
        <span>Select curriculum version used for checking Bachelor Honours eligibility</span>
        <CurriculumPicker
          curriculum={curriculum}
          programmeCodes={[programmeCode]}
          setCurriculum={setCurriculum}
          year={new Date().getFullYear()}
        />
      </Stack>
      {honours && (
        <StyledAccordion expanded={showHonoursModules} onChange={() => setShowHonoursModules(!showHonoursModules)}>
          <AccordionSummary expandIcon={<ArrowDropDownIcon />} sx={{ fontWeight: 'bold' }}>
            Study modules
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <div>
                <Typography fontWeight="bold" gutterBottom>
                  Main modules
                </Typography>
                {mainModules.length > 0 && (
                  <ModuleTable cypress="main-modules" data={mainModules} getTextIn={getTextIn} />
                )}
              </div>
              <div>
                <Typography fontWeight="bold" gutterBottom>
                  Other modules
                </Typography>
                {otherModules.length > 0 && (
                  <ModuleTable cypress="other-modules" data={otherModules} getTextIn={getTextIn} />
                )}
              </div>
            </Stack>
          </AccordionDetails>
        </StyledAccordion>
      )}
    </Section>
  )
}
