import { Stack, Typography } from '@mui/material'
import { flatten } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'
import { Form, Label } from 'semantic-ui-react'

import { getFullStudyProgrammeRights } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/material/Section'
import { RootState } from '@/redux'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { setValue } from '@/redux/coursesSummaryForm'
import { ALL, getAllStudyProgrammes, getQueryInfo, summaryStatistics } from '@/selectors/courseStats'
import { AttemptData } from '@/types/attemptData'
import { userHasAccessToAllCourseStats } from '../courseStatisticsUtils'
import { ProgrammeDropdown } from '../ProgrammeDropdown'
import { AttemptsTable } from './AttemptsTable'
import { exportToExcel } from './export'

// Certified JavaScript moment but basically this was crashing
// since sometimes object like {en: ..., fi: ...., sv: ....}
// was being passed to React which is not legal but then again
// it works sometimes? so doing this to make sure while fixing
// the crash the realisations that worked will keep working
const unObjectifyProperty = ({ obj, property }) => {
  const suspectField = obj[property]
  if (typeof suspectField === 'object' && suspectField !== null) {
    if (suspectField.en) {
      return { ...obj, [property]: suspectField.en }
    }
    throw Error(`Invalid object being tried to pass to React: ${JSON.stringify(suspectField)}`)
  }
  return { ...obj, [property]: suspectField }
}

export const SummaryTab = ({ onClickCourse }: { onClickCourse: (courseCode: string) => void }) => {
  const { roles, programmeRights } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const userHasAccessToAllStats = userHasAccessToAllCourseStats(roles, fullStudyProgrammeRights)
  const dispatch = useDispatch()
  const programmes = useSelector(state => getAllStudyProgrammes(state))
  const form = useSelector((state: RootState) => state.courseSummaryForm)
  const statistics = useSelector((state: RootState) => summaryStatistics(state))
  const queryInfo = useSelector((state: RootState) => getQueryInfo(state))
  const { getTextIn } = useLanguage()

  const handleChange = (_, { name, value }) => {
    let selected = [...value].filter(v => v !== ALL.value)
    if ((!form.programmes.includes(ALL.value) && value.includes(ALL.value)) || value.length === 0) {
      selected = [ALL.value]
    }
    dispatch(setValue(name, selected))
  }

  const data: AttemptData[] = statistics.map(stat => {
    const { coursecode, name, realisations, summary } = stat
    const { passed, failed, passrate } = summary
    return {
      id: coursecode,
      category: getTextIn(name),
      passed,
      failed,
      passrate,
      realisations: realisations.map(obj => {
        return unObjectifyProperty({ obj, property: 'realisation' })
      }),
    }
  })

  const options = programmes
    .map(programme => ({ ...programme, size: new Set(flatten(Object.values(programme.students))).size }))
    .filter(programme => programme.size > 0)
    .map(({ text, ...rest }) => ({ text: typeof text === 'string' ? text : getTextIn(text), ...rest }))
    .map(programme => ({ ...programme, name: programme.text }))

  return (
    <Section>
      <Stack gap={2}>
        <Section>
          <Form>
            {userHasAccessToAllStats && (
              <>
                <Typography component="h3" variant="h6">
                  Filter statistics by study programmes
                </Typography>
                <ProgrammeDropdown
                  label="Study programmes"
                  name="programmes"
                  onChange={handleChange}
                  options={options}
                  value={form.programmes}
                />
              </>
            )}
            <Form.Field>
              <label>Timeframe</label>
              <Label.Group>
                {queryInfo.timeframe.map(objBeforeUbObjectifying => {
                  const obj = unObjectifyProperty({ obj: objBeforeUbObjectifying, property: 'name' })
                  const { code, name } = obj
                  return <Label content={name} key={code} />
                })}
              </Label.Group>
            </Form.Field>
          </Form>
        </Section>
        <Section exportOnClick={() => exportToExcel(data)}>
          <AttemptsTable data={data} onClickCourse={onClickCourse} userHasAccessToAllStats={userHasAccessToAllStats} />
          {!userHasAccessToAllStats && (
            <span className="totalsDisclaimer">* Years with 5 students or fewer are NOT included in the total</span>
          )}
        </Section>
      </Stack>
    </Section>
  )
}
