import React, { useEffect, useState } from 'react'
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
import useFilters from '../FilterTray/useFilters'

const PopulationCourses = ({
  populationSelectedStudentCourses,
  populationCourses,
  dispatchRefreshFilters,
  selectedStudents,
  translate,
  getPopulationSelectedStudentCourses: gpc,
  query,
  filteredStudents
}) => {
  const { setCourses: setCourseFilterData, setCourseQueryOpts, runCourseQuery } = useCourseFilter()
  const { activeFilters } = useFilters()

  const selectedPopulationCourses = populationSelectedStudentCourses.data
    ? populationSelectedStudentCourses
    : populationCourses

  const { CoursesOf } = infotooltips.PopulationStatistics
  const { pending } = selectedPopulationCourses

  /*
  ORIGINAL:
  const reloadCourses = () => {
    const selectedStudentsByYear = {}

    if (filteredStudents && filteredStudents.length > 0) {
      filteredStudents.forEach(student => {
        if (!selectedStudentsByYear[new Date(student.studyrightStart).getFullYear()]) {
          selectedStudentsByYear[new Date(student.studyrightStart).getFullYear()] = []
        }
        selectedStudentsByYear[new Date(student.studyrightStart).getFullYear()].push(student.studentNumber)
      })
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
  */

  // FIXME: Temporary hack to pass course data to new filters, improve.
  /**
   * Basically, there exists a race condition between applying filters in client and fetching
   * an updated course stats payload from backend. The best remedy would be to handle the stats
   * fetching in useCourseFilter hook instead of redux. As is, the client uses the full set of
   * stats for filtering (hook) that is fetched only once and never updated, and another set
   * for courses of population table (redux) that gets updated as usual.
   */
  /*
  useEffect(() => {
    reloadCourses()
  }, [activeFilters])
  */

  const makeCourseQueryOpts = () => {
    const selectedStudentsByYear = {}

    if (filteredStudents && filteredStudents.length > 0) {
      filteredStudents.forEach(student => {
        if (!selectedStudentsByYear[new Date(student.studyrightStart).getFullYear()]) {
          selectedStudentsByYear[new Date(student.studyrightStart).getFullYear()] = []
        }
        selectedStudentsByYear[new Date(student.studyrightStart).getFullYear()].push(student.studentNumber)
      })
    }

    return {
      ...selectedPopulationCourses.query,
      uuid: uuidv4(),
      studyRights: [query.studyRights.programme],
      selectedStudents,
      selectedStudentsByYear,
      year: query.year,
      years: query.years
    }
  }

  useEffect(() => {
    // Probably wanna do this in course filter card, eh?
    if (filteredStudents.length) {
      const opts = makeCourseQueryOpts()
      // console.log(opts)
      //setCourseQueryOpts(opts)
      dispatchRefreshFilters()
      runCourseQuery(opts)
    }
  }, [filteredStudents]) // should probably be [activeFilters]

  const [once, setOnce] = useState(true)
  useEffect(() => {
    const { pending, error, data } = selectedPopulationCourses
    if (!pending && !error && once) {
      setCourseFilterData(data.coursestatistics)
      setOnce(false)
    }
  }, [selectedPopulationCourses.data])

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
}

PopulationCourses.defaultPropTypes = {
  query: {}
}

PopulationCourses.propTypes = {
  populationSelectedStudentCourses: shape({ query: shape({}), data: shape({}), pending: bool }).isRequired,
  populationCourses: shape({ query: shape({}), data: shape({}), pending: bool }).isRequired,
  translate: func.isRequired,
  selectedStudents: arrayOf(string).isRequired,
  getPopulationSelectedStudentCourses: func.isRequired,
  dispatchRefreshFilters: func.isRequired,
  query: shape({}).isRequired,
  filteredStudents: arrayOf(shape({})).isRequired
}

const mapStateToProps = ({ populationSelectedStudentCourses, populationCourses, localize }) => ({
  populationCourses,
  populationSelectedStudentCourses,
  translate: getTranslate(localize)
})

export default connect(
  mapStateToProps,
  {
    getPopulationSelectedStudentCourses,
    dispatchRefreshFilters: refreshFilters
  }
)(PopulationCourses)
