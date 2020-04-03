import React, { memo, useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import { func, bool, shape, arrayOf, string } from 'prop-types'
import { Header, Segment, Divider, Radio } from 'semantic-ui-react'
import { intersection, flattenDeep } from 'lodash'

import PopulationSearchForm from '../PopulationSearchForm'
import PopulationSearchHistory from '../PopulationSearchHistory'
import PopulationDetails from '../PopulationDetails'
import PopulationFilters from '../PopulationFilters'
import InfoBox from '../InfoBox'
import ProgressBar from '../ProgressBar'

import infoTooltips from '../../common/InfoToolTips'
import { getUserIsAdmin, flattenStudyrights, getTotalCreditsFromCourses } from '../../common'
import { useProgress, useTitle } from '../../common/hooks'
import selectors from '../../selectors/populationDetails'

// this code is horrible now and I am kinda sorry for it. Will fix once everything is specced

const PopulationStatistics = memo(props => {
  const { translate, populationFound, loading, location, history, isAdmin } = props
  const [accordionView, setAccordion] = useState(false)
  const [excluded, setExcluded] = useState([])

  const { onProgress, progress } = useProgress(loading)
  useTitle('Population statistics')
  useEffect(() => {
    if (props.queryIsSet) {
      const { query, tagstudent, selectedStudents, samples, studytracks } = props
      const studyrights = samples.flatMap(student =>
        flattenStudyrights(student.studyrights, query.studyRights.programme)
      )
      const studytracksInPopulation = intersection(Object.keys(studytracks), studyrights)

      const excludedFilters = []

      if (!query.studentStatuses.includes('CANCELLED')) excludedFilters.push('CanceledStudyright')

      const taggedStudentNumbers = tagstudent.map(tag => tag.studentnumber)

      if (intersection(taggedStudentNumbers, selectedStudents) < 1) excludedFilters.push('TagFilter')

      if (studytracksInPopulation.length < 1) excludedFilters.push('StudytrackFilter')
      setExcluded(excludedFilters)
    }
  }, [props.selectedStudents])

  const renderPopulationSearch = () => {
    const { Main } = infoTooltips.PopulationStatistics
    console.log(!'')
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
        <PopulationSearchForm onProgress={onProgress} />
        <Divider />
        {location.search !== '' ? (
          <>
            {isAdmin ? <Radio id="accordion-toggle" toggle onChange={() => setAccordion(!accordionView)} /> : null}
            <PopulationSearchHistory history={history} />
            {!props.isLoading && props.queryIsSet && accordionView && (
              <PopulationFilters samples={props.samples} exclude={excluded} accordionView={accordionView} />
            )}
          </>
        ) : null}
        <ProgressBar fixed progress={progress} />
      </Segment>
    )
  }
  return (
    <div className="segmentContainer">
      <Header className="segmentTitle" size="large">
        {translate('populationStatistics.header')}
      </Header>
      <Segment className="contentSegment">
        {renderPopulationSearch()}
        {location.search !== '' ? <PopulationDetails accordionView={accordionView} /> : null}
      </Segment>
    </div>
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
  selectedStudents: arrayOf(string).isRequired,
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
  studytracks: shape({}).isRequired
}

const mapStateToProps = state => {
  const { samples, selectedStudents, complemented, selectedStudentsByYear } = selectors.makePopulationsToData(state)
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
    selectedStudents,
    complemented,
    queryIsSet: !!populations.query,
    selectedStudentsByYear,
    tagstudent: state.tagstudent.data || {},
    samples,
    studytracks: state.populationDegreesAndProgrammes.data.studyTracks || {},
    isLoading: populations.pending === true
  }
}

export default connect(mapStateToProps)(PopulationStatistics)
