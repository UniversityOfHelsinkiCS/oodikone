import React from 'react'
import { Form, Label, Segment, Header } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { shape, arrayOf, func, oneOfType, number, string, bool } from 'prop-types'
import { flatten } from 'lodash'
import selectors, { ALL } from '../../../selectors/courseStats'
import { fields, setValue } from '../../../redux/coursesSummaryForm'
import AttemptsTable from '../AttemptsTable'
import ProgrammeDropdown from '../ProgrammeDropdown'
import useLanguage from '../../LanguagePicker/useLanguage'
import { getTextIn } from '../../../common'
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

const SummaryTab = ({ form, setValue, statistics, programmes, queryInfo, onClickCourse, userHasAccessToAllStats }) => {
  const { language } = useLanguage()
  const handleChange = (e, { name, value }) => {
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
      category: getTextIn(name, language),
      passed,
      failed,
      passrate,
      realisations: realisations.map(obj => {
        return unObjectifyProperty({ obj, property: 'realisation' })
      })
    }
  })

  const options = programmes
    .map(e => ({ ...e, size: new Set(flatten(Object.values(e.students))).size }))
    .filter(e => e.size > 0)
    .map(({ text, ...rest }) => ({ text: typeof text === 'string' ? text : getTextIn(text, language), ...rest }))
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
      {
        <AttemptsTable
          categoryName="Course"
          onClickCourse={onClickCourse}
          data={data}
          userHasAccessToAllStats={userHasAccessToAllStats}
        />
      }
      {!userHasAccessToAllStats && (
        <span className="totalsDisclaimer">* Years with 5 students or less are NOT included in the total</span>
      )}
    </div>
  )
}

SummaryTab.propTypes = {
  statistics: arrayOf(
    shape({
      coursecode: oneOfType([number, string]),
      name: shape({
        fi: string,
        en: string,
        sv: string
      }),
      summary: shape({
        failed: number,
        passed: number,
        passrate: oneOfType([number, string])
      })
    })
  ).isRequired,
  programmes: arrayOf(shape({})).isRequired,
  form: shape({}).isRequired,
  setValue: func.isRequired,
  queryInfo: shape({
    courses: arrayOf(shape({})),
    timeframe: arrayOf(shape({}))
  }).isRequired,
  onClickCourse: func.isRequired,
  userHasAccessToAllStats: bool.isRequired
}

const mapStateToProps = state => {
  const { roles } = state.auth.token
  const { rights } = state.auth.token
  const userHasAccessToAllStats = userHasAccessToAllCourseStats(roles, rights)
  const programmes = selectors.getAllStudyProgrammes(state)
  const programmeCodes = state.courseSummaryForm[fields.programmes]
  return {
    form: state.courseSummaryForm,
    statistics: selectors.summaryStatistics(state, { programmes, programmeCodes }, userHasAccessToAllStats),
    queryInfo: selectors.getQueryInfo(state),
    programmes
  }
}

export default connect(mapStateToProps, { setValue })(SummaryTab)
