import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import CloseIcon from '@mui/icons-material/Close'
import DoneIcon from '@mui/icons-material/Done'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import dayjs from 'dayjs'
import { useState } from 'react'

import {
  bachelorHonoursProgrammes as bachelorCodes,
  bachelorHonoursBasicModules as basicHonoursModules,
  bachelorHonoursIntermediateModules as intermediateHonoursModules,
} from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { CurriculumPicker } from '@/components/material/CurriculumPicker'
import { StyledAccordion } from '@/components/material/StyledAccordion'
import { StyledTable } from '@/components/material/StyledTable'
import { Section } from '@/components/Section'
import { DateFormat } from '@/constants/date'
import { reformatDate } from '@/util/timeAndDate'
import { useCurriculumState } from '../../../hooks/useCurriculums'

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
          <TableCell>{reformatDate(module.date, DateFormat.DISPLAY_DATE)}</TableCell>
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
  const [curriculum, curriculumList, setCurriculum] = useCurriculumState(
    programmeCode,
    new Date().getFullYear().toString()
  )

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
    studyStartDate = dayjs(studyRightWithCorrectProgramme.startDate)
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
    const graduationDate = dayjs(degreeModule.date)
    const yearsForGraduation = graduationDate.diff(studyStartDate, 'years', true)

    // calculate time student has been absent during bachelors degree
    const timeAbsent = absentYears.reduce((acc, curr) => {
      const start = dayjs(curr.startDate)
      const end = dayjs(curr.endDate)

      // if absent years are not in the degree start and end range return acc
      if (start < studyStartDate || start > graduationDate) return acc
      const diff = end.diff(start, 'years', true)
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
        {!honours && reason ? <Chip color="error" data-cy="honours-chip-error" label={reason} /> : null}
        {inspection && <Chip color="info" data-cy="honours-chip-inspection" label="Might need further inspection" />}
      </Stack>
      <Stack alignItems="center" direction="row" spacing={1} sx={{ marginTop: 2 }}>
        <span>Select curriculum version used for checking Bachelor Honours eligibility</span>
        <CurriculumPicker curriculum={curriculum} curriculumList={curriculumList} setCurriculum={setCurriculum} />
      </Stack>
      {honours ? (
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
      ) : null}
    </Section>
  )
}
