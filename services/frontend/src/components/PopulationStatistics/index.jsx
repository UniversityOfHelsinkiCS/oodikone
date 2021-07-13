import React, { memo, useEffect } from 'react'
import { connect } from 'react-redux'
import { bool, shape, arrayOf, any } from 'prop-types'
import { Header, Segment } from 'semantic-ui-react'
import { flattenDeep } from 'lodash'
import PopulationDetails from '../PopulationDetails'
import { getTotalCreditsFromCourses } from '../../common'
import { useTitle } from '../../common/hooks'
import selectors from '../../selectors/populationDetails'
import FilterTray from '../FilterTray'
import useFilters from '../FilterTray/useFilters'
import { PopulationStatisticsFilters } from '../FilterTray/FilterSets'
import PopulationSearch from '../PopulationSearch'
import DataExport from './DataExport'

const PopulationStatistics = memo(props => {
  const { queryIsSet, selectedStudentsByYear, query, samples, location, history, isLoading, students } = props
  const { setAllStudents } = useFilters()
  useTitle('Population statistics')

  // Pass students to filter context.
  useEffect(() => {
    setAllStudents(students)
  }, [students])

  return (
    <FilterTray filterSet={<PopulationStatisticsFilters />} visible={location.search !== ''}>
      <div className="segmentContainer">
        <Header className="segmentTitle" size="large">
          Population statistics
        </Header>
        <Segment className="contentSegment">
          <PopulationSearch history={history} location={location} />
          {location.search !== '' ? (
            <PopulationDetails
              queryIsSet={queryIsSet}
              selectedStudentsByYear={selectedStudentsByYear}
              query={query}
              samples={samples}
              isLoading={isLoading}
              dataExport={<DataExport />}
            />
          ) : null}
        </Segment>
      </div>
    </FilterTray>
  )
})

PopulationStatistics.propTypes = {
  location: shape({}).isRequired,
  history: shape({}).isRequired,
  samples: arrayOf(shape({})).isRequired,
  queryIsSet: bool.isRequired,
  isLoading: bool.isRequired,
  selectedStudentsByYear: shape({}).isRequired,
  query: shape({}).isRequired,
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

  const { populations } = state

  return {
    query: populations.query ? populations.query : {},
    queryIsSet: !!populations.query,
    selectedStudentsByYear,
    samples,
    isLoading: populations.pending === true,
    students: populations.data.students || []
  }
}

export default connect(mapStateToProps)(PopulationStatistics)
