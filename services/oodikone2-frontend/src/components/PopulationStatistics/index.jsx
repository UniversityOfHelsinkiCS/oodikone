import React, { memo, useEffect } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import { func, bool, shape, arrayOf, any } from 'prop-types'
import { Header, Segment, Divider, Form } from 'semantic-ui-react'
import { flattenDeep } from 'lodash'
import PopulationSearchForm from '../PopulationSearchForm'
import PopulationSearchHistory from '../PopulationSearchHistory'
import PopulationDetails from '../PopulationDetails'
import InfoBox from '../InfoBox'
import ProgressBar from '../ProgressBar'
import infoTooltips from '../../common/InfoToolTips'
import { getUserIsAdmin, getTotalCreditsFromCourses } from '../../common'
import { useProgress, useTitle } from '../../common/hooks'
import selectors from '../../selectors/populationDetails'
import FilterTray from '../FilterTray'
import useFeatureToggle from '../../common/useFeatureToggle'
import useFilters from '../FilterTray/useFilters'

const PopulationStatistics = memo(props => {
  const {
    translate,
    queryIsSet,
    selectedStudentsByYear,
    query,
    samples,
    populationFound,
    loading,
    location,
    history,
    isAdmin,
    isLoading,
    students
  } = props
  const [mandatoryToggle, , toggleMandatoryToggle] = useFeatureToggle('mandatoryToggle')
  const { setAllStudents } = useFilters()

  const { onProgress, progress } = useProgress(loading)
  useTitle('Population statistics')

  // Pass students to filter context.
  useEffect(() => {
    setAllStudents(students)
  }, [students])

  const renderPopulationSearch = () => {
    const { Main } = infoTooltips.PopulationStatistics

    const title =
      populationFound && history.location.search
        ? translate('populationStatistics.foundTitle')
        : translate('populationStatistics.searchTitle')

    return (
      <Segment>
        <Header size="medium">
          {title}
          {(!populationFound || !history.location.search) && <InfoBox content={Main} />}
        </Header>
        <PopulationSearchForm onProgress={onProgress} mandatoryToggle={mandatoryToggle} />
        <Divider />
        {location.search !== '' ? (
          <>
            {isAdmin ? (
              <Form>
                <Form.Group inline>
                  <Form.Radio
                    id="accordion-toggle"
                    checked={mandatoryToggle}
                    toggle
                    onClick={toggleMandatoryToggle}
                    label="Toggle Mandatory Courses"
                  />
                </Form.Group>
              </Form>
            ) : null}
            <PopulationSearchHistory history={history} />
          </>
        ) : null}
        <ProgressBar fixed progress={progress} />
      </Segment>
    )
  }

  return (
    <FilterTray>
      <div className="segmentContainer">
        <Header className="segmentTitle" size="large">
          {translate('populationStatistics.header')}
        </Header>
        <Segment className="contentSegment">
          {renderPopulationSearch()}
          {location.search !== '' ? (
            <PopulationDetails
              translate={translate}
              queryIsSet={queryIsSet}
              selectedStudentsByYear={selectedStudentsByYear}
              query={query}
              samples={samples}
              isLoading={isLoading}
              mandatoryToggle={mandatoryToggle}
            />
          ) : null}
        </Segment>
      </div>
    </FilterTray>
  )
})

PopulationStatistics.propTypes = {
  translate: func.isRequired,
  populationFound: bool.isRequired,
  loading: bool.isRequired,
  location: shape({}).isRequired,
  history: shape({}).isRequired,
  isAdmin: bool.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  samples: arrayOf(shape({})).isRequired,
  queryIsSet: bool.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  isLoading: bool.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  selectedStudentsByYear: shape({}).isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  query: shape({}).isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  tagstudent: arrayOf(shape({})).isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  studytracks: shape({}).isRequired,
  students: arrayOf(any).isRequired
}

const mapStateToProps = state => {
  // haha copied from other place :mintu:
  const { samples, selectedStudentsByYear } = selectors.makePopulationsToData(state)
  // REFACTOR YES, IF YOU SEE THIS COMMENT YOU ARE OBLIGATED TO FIX IT
  if (samples.length > 0) {
    const creditsAndDates = samples.map(s => {
      const passedCourses = s.courses.filter(c => c.passed)
      const passedCredits = getTotalCreditsFromCourses(passedCourses)
      const dates = passedCourses.map(c => c.date)
      const datesWithCredits = passedCourses.filter(c => c.credits > 0).map(c => c.date)
      return { passedCredits, dates, datesWithCredits }
    })
    const credits = creditsAndDates.map(cd => cd.passedCredits)
    const dates = flattenDeep(creditsAndDates.map(cd => cd.dates)).map(date => new Date(date).getTime())
    const datesWithCredits = flattenDeep(creditsAndDates.map(cd => cd.datesWithCredits)).map(date =>
      new Date(date).getTime()
    )
    samples.maxCredits = Math.max(...credits)
    samples.maxDate = Math.max(...dates)
    samples.minDate = Math.min(...dates)
    samples.minDateWithCredits = Math.min(...datesWithCredits)
  }

  const {
    localize,
    populations,
    auth: {
      token: { roles }
    }
  } = state

  return {
    translate: getTranslate(localize),
    currentLanguage: getActiveLanguage(localize).value,
    loading: populations.pending,
    populationFound: populations.data.students !== undefined,
    query: populations.query ? populations.query : {},
    isAdmin: getUserIsAdmin(roles),
    queryIsSet: !!populations.query,
    selectedStudentsByYear,
    tagstudent: state.tagstudent.data || {},
    samples,
    studytracks: state.populationDegreesAndProgrammes.data.studyTracks || {},
    isLoading: populations.pending === true,
    students: populations.data.students || []
  }
}

export default connect(mapStateToProps)(PopulationStatistics)
