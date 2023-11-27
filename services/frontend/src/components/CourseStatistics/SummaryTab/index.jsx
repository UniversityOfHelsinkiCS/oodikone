import React from 'react'
import { Form, Label, Segment, Header } from 'semantic-ui-react'
import { connect, useSelector } from 'react-redux'
import { flatten } from 'lodash'

import { useGetAuthorizedUserQuery } from 'redux/auth'
import { fields, setValue } from 'redux/coursesSummaryForm'
import { ALL, getAllStudyProgrammes, summaryStatistics, getQueryInfo } from '../../../selectors/courseStats'
import { AttemptsTable } from '../AttemptsTable'
import { ProgrammeDropdown } from '../ProgrammeDropdown'
import { useLanguage } from '../../LanguagePicker/useLanguage'
import { userHasAccessToAllCourseStats } from '../courseStatisticsUtils'

// Certified JavaScript moment but basically this was crashing
// since sometimes object like {en: ..., fi: ...., sv: ....}
// was being passed to React which is not legal but then again
// it works sometimes? so doing this to make sure while fixing
// the crash the realisations that worked will keep working
const unObjectifyProperty = ({ obj, property }) => {
  const suspectField = obj[property]
  if (typeof suspectField === 'object' && suspectField !== null) {
    if (suspectField.en) return { ...obj, [property]: suspectField.en }

    throw Error(`Invalid object being tried to pass to React: ${JSON.stringify(suspectField)}`)
  }

  return { ...obj, [property]: suspectField }
}

const SummaryTab = ({ setValue, onClickCourse }) => {
  const { roles, rights } = useGetAuthorizedUserQuery()
  const userHasAccessToAllStats = userHasAccessToAllCourseStats(roles, rights)
  const programmes = useSelector(state => getAllStudyProgrammes(state))
  const programmeCodes = useSelector(({ courseSummaryForm }) => courseSummaryForm[fields.programmes])
  const form = useSelector(({ courseSummaryForm }) => courseSummaryForm)
  const statistics = useSelector(state =>
    summaryStatistics(state, { programmes, programmeCodes }, userHasAccessToAllStats)
  )
  const queryInfo = useSelector(state => getQueryInfo(state))

  const { getTextIn } = useLanguage()
  const handleChange = (_, { name, value }) => {
    let selected = [...value].filter(v => v !== ALL.value)
    if ((!form[fields.programmes].includes(ALL.value) && value.includes(ALL.value)) || value.length === 0) {
      selected = [ALL.value]
    }
    setValue(name, selected)
  }

  const data = statistics.map(stat => {
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
    .map(e => ({ ...e, size: new Set(flatten(Object.values(e.students))).size }))
    .filter(e => e.size > 0)
    .map(({ text, ...rest }) => ({ text: typeof text === 'string' ? text : getTextIn(text), ...rest }))
    .map(prog => ({ ...prog, name: prog.text }))

  return (
    <div>
      <Segment>
        <Form>
          {userHasAccessToAllStats && (
            <>
              <Header as="h4">Filter statistics by study programmes</Header>
              <ProgrammeDropdown
                options={options}
                label="Study programmes:"
                name={fields.programmes}
                onChange={handleChange}
                value={form[fields.programmes]}
              />
            </>
          )}
          <Form.Field>
            <label>Timeframe:</label>
            <Label.Group>
              {queryInfo.timeframe.map(objBeforeUbObjectifying => {
                const obj = unObjectifyProperty({ obj: objBeforeUbObjectifying, property: 'name' })
                const { code, name } = obj
                return <Label key={code} content={name} />
              })}
            </Label.Group>
          </Form.Field>
        </Form>
      </Segment>
      <AttemptsTable
        categoryName="Course"
        onClickCourse={onClickCourse}
        data={data}
        userHasAccessToAllStats={userHasAccessToAllStats}
      />
      {!userHasAccessToAllStats && (
        <span className="totalsDisclaimer">* Years with 5 students or less are NOT included in the total</span>
      )}
    </div>
  )
}

export const ConnectedSummaryTab = connect(null, { setValue })(SummaryTab)
