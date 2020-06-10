import React, { memo, useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import { func, bool, shape, arrayOf, string, any } from 'prop-types'
import { Header, Segment, Divider, Form } from 'semantic-ui-react'
import { intersection, flattenDeep } from 'lodash'
import { createStore, useStore } from 'react-hookstore'
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
import FilterTray from '../FilterTray'

createStore('mandatoryToggle', window.localStorage.getItem('oodikoneMandatoryToggle') === 'true')
createStore('filterFeatToggle', window.localStorage.getItem('oodikoneFilterFeatToggle') === 'true')

const PopulationStatistics = memo(props => {
  const {
    translate,
    selectedStudents,
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
  const [filteredStudents, setFilteredStudents] = useState(students)
  const [mandatoryToggle, setMandatoryToggle] = useStore('mandatoryToggle')
  const [filterFeatToggle, setFilterFeatToggle] = useStore('filterFeatToggle')
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

  const getStudentNumbers = students => {
    if (!students) {
      return []
    }

    return students.map(s => s.studentNumber)
  }

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
                    onChange={() => {
                      const newVal = !mandatoryToggle
                      setMandatoryToggle(newVal)
                      localStorage.setItem('oodikoneMandatoryToggle', newVal)
                    }}
                    label="Toggle Mandatory Courses"
                  />
                  <Form.Radio
                    checked={filterFeatToggle}
                    toggle
                    onChange={() => {
                      const newVal = !filterFeatToggle
                      setFilterFeatToggle(newVal)
                      localStorage.setItem('oodikoneFilterFeatToggle', newVal)
                    }}
                    label="Toggle New Filters"
                  />
                </Form.Group>
              </Form>
            ) : null}
            <PopulationSearchHistory history={history} />
            {!props.isLoading && props.queryIsSet && !filterFeatToggle && (
              <>
                <Divider />
                <PopulationFilters samples={props.samples} exclude={excluded} />
              </>
            )}
          </>
        ) : null}
        <ProgressBar fixed progress={progress} />
      </Segment>
    )
  }

  const renderAcualComponent = () => (
    <div className="segmentContainer">
      <Header className="segmentTitle" size="large">
        {translate('populationStatistics.header')}
      </Header>
      <Segment className="contentSegment">
        {renderPopulationSearch()}
        {location.search !== '' ? (
          <PopulationDetails
            translate={translate}
            selectedStudents={filterFeatToggle ? getStudentNumbers(filteredStudents) : selectedStudents}
            filteredStudents={filteredStudents}
            allStudents={students}
            queryIsSet={queryIsSet}
            selectedStudentsByYear={selectedStudentsByYear}
            query={query}
            samples={samples}
            isLoading={isLoading}
            mandatoryToggle={mandatoryToggle}
            filterFeatToggle={filterFeatToggle}
          />
        ) : null}
      </Segment>
    </div>
  )

  return filterFeatToggle ? (
    <FilterTray setFilteredStudents={setFilteredStudents} filteredStudents={filteredStudents} allStudents={students}>
      {renderAcualComponent()}
    </FilterTray>
  ) : (
    renderAcualComponent()
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
  studytracks: shape({}).isRequired,
  students: arrayOf(any).isRequired
}

const mapStateToProps = state => {
  // haha copied from other place :mintu:
  const { samples, selectedStudents, selectedStudentsByYear } = selectors.makePopulationsToData(state)
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
