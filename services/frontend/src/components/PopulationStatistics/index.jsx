import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { createSelector } from 'reselect'
import { useLocation, useHistory } from 'react-router-dom'
import { Header, Segment } from 'semantic-ui-react'
import PopulationDetails from '../PopulationDetails'
import { useTitle } from '../../common/hooks'
import selectors from '../../selectors/populationDetails'
import FilterTray from '../FilterTray'
import useFilters from '../FilterTray/useFilters'
import { PopulationStatisticsFilters } from '../FilterTray/FilterSets'
import PopulationSearch from '../PopulationSearch'
import DataExport from './DataExport'

const selectPopulations = createSelector(
  ({ populations }) => populations,
  populations => ({
    query: populations.query ?? {},
    queryIsSet: !!populations.query,
    isLoading: populations.pending === true,
    students: populations.data.students ?? [],
  })
)

const PopulationStatistics = () => {
  const location = useLocation()
  const history = useHistory()
  const { samples } = useSelector(selectors.makePopulationsToData)
  const { query, queryIsSet, isLoading, students } = useSelector(selectPopulations)
  const { setAllStudents } = useFilters()

  useTitle('Population statistics')

  // Pass students to filter context.
  useEffect(() => {
    setAllStudents(students)
  }, [students])

  return (
    <FilterTray filterSet={<PopulationStatisticsFilters query={query} />} visible={location.search !== ''}>
      <div className="segmentContainer">
        <Header className="segmentTitle" size="large">
          Population statistics
        </Header>
        <Segment className="contentSegment">
          <PopulationSearch history={history} location={location} />
          {location.search !== '' ? (
            <PopulationDetails
              queryIsSet={queryIsSet}
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
}

export default PopulationStatistics
