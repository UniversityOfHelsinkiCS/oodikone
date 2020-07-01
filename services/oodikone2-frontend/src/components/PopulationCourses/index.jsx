import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { func, shape, arrayOf, string, bool } from 'prop-types'
import { Segment, Header } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import uuidv4 from 'uuid/v4'
import SegmentDimmer from '../SegmentDimmer'
import PopulationCourseStats from '../PopulationCourseStats'
import InfoBox from '../InfoBox'
import infotooltips from '../../common/InfoToolTips'
import { getPopulationSelectedStudentCourses } from '../../redux/populationSelectedStudentCourses'
import { refreshFilters } from '../../redux/populationFilters'
import useCourseFilter from '../FilterTray/filters/Courses/useCourseFilter'
import useFeatureToggle from '../../common/useFeatureToggle'

const PopulationCourses = ({
  populationSelectedStudentCourses,
  populationCourses,
  refreshNeeded,
  dispatchRefreshFilters,
  selectedStudents,
  translate,
  getPopulationSelectedStudentCourses: gpc,
  selectedStudentsByYear,
  query,
  accordionView,
  filteredStudents
}) => {
  const [filterFeatToggle] = useFeatureToggle('filterFeatToggle')
  const { setCourses: setCourseFilterData } = useCourseFilter()

  const selectedPopulationCourses = populationSelectedStudentCourses.data
    ? populationSelectedStudentCourses
    : populationCourses

  const { CoursesOf } = infotooltips.PopulationStatistics
  const { pending } = selectedPopulationCourses

  const reloadCourses = () => {
    if (filterFeatToggle) {
      // eslint-disable-next-line
      selectedStudentsByYear = {}

      if (filteredStudents && filteredStudents.length > 0) {
        filteredStudents.forEach(student => {
          if (!selectedStudentsByYear[new Date(student.studyrightStart).getFullYear()]) {
            selectedStudentsByYear[new Date(student.studyrightStart).getFullYear()] = []
          }
          selectedStudentsByYear[new Date(student.studyrightStart).getFullYear()].push(student.studentNumber)
        })
      }
    }

    dispatchRefreshFilters()
    gpc({
      ...selectedPopulationCourses.query,
      uuid: uuidv4(),
      studyRights: [query.studyRights.programme],
      selectedStudents,
      selectedStudentsByYear,
      year: query.year,
      years: query.years
    })
  }

  // Refresh hook for old filters.
  useEffect(() => {
    if (refreshNeeded) {
      reloadCourses()
    }
  }, [refreshNeeded])

  // ...and for new ones.
  useEffect(() => {
    reloadCourses()
  }, [filteredStudents])

  // TODO: Temporary hack to pass course data to new filters, improve.
  useEffect(() => {
    const { pending, error, data } = selectedPopulationCourses
    if (filterFeatToggle && !pending && !error) {
      setCourseFilterData(data.coursestatistics)
    }
  }, [selectedPopulationCourses.data])

  if (accordionView)
    return (
      <Segment basic>
        <Header>
          <InfoBox content={CoursesOf.Infobox} />
        </Header>
        <SegmentDimmer translate={translate} isLoading={pending} />
        <PopulationCourseStats
          key={selectedPopulationCourses.query.uuid}
          courses={selectedPopulationCourses.data}
          query={selectedPopulationCourses.query}
          pending={pending}
          selectedStudents={selectedStudents}
        />
      </Segment>
    )

  return (
    <React.Fragment>
      <Segment>
        {!accordionView && (
          <Header size="medium" dividing>
            {translate('populationCourses.header')}
            <InfoBox content={CoursesOf.Infobox} />
          </Header>
        )}
        <SegmentDimmer translate={translate} isLoading={pending} />
        <PopulationCourseStats
          key={selectedPopulationCourses.query.uuid}
          courses={selectedPopulationCourses.data}
          query={selectedPopulationCourses.query}
          pending={pending}
          selectedStudents={selectedStudents}
        />
      </Segment>
    </React.Fragment>
  )
}

PopulationCourses.defaultPropTypes = {
  query: {}
}

PopulationCourses.propTypes = {
  populationSelectedStudentCourses: shape({ query: shape({}), data: shape({}), pending: bool }).isRequired,
  populationCourses: shape({ query: shape({}), data: shape({}), pending: bool }).isRequired,
  refreshNeeded: bool.isRequired,
  translate: func.isRequired,
  selectedStudents: arrayOf(string).isRequired,
  getPopulationSelectedStudentCourses: func.isRequired,
  dispatchRefreshFilters: func.isRequired,
  selectedStudentsByYear: shape({}).isRequired,
  query: shape({}).isRequired,
  accordionView: bool.isRequired,
  filteredStudents: arrayOf(shape({})).isRequired
}

const mapStateToProps = ({ populationSelectedStudentCourses, populationCourses, localize, populationFilters }) => ({
  populationCourses,
  populationSelectedStudentCourses,
  refreshNeeded: populationFilters.refreshNeeded,
  translate: getTranslate(localize)
})

export default connect(
  mapStateToProps,
  {
    getPopulationSelectedStudentCourses,
    dispatchRefreshFilters: refreshFilters
  }
)(PopulationCourses)
