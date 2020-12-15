import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { shape, arrayOf, string, bool } from 'prop-types'
import { Segment, Button, Icon, Modal } from 'semantic-ui-react'
import uuidv4 from 'uuid/v4'
import SegmentDimmer from '../SegmentDimmer'
import PopulationCourseStats from '../PopulationCourseStats'
import InfoBox from '../InfoBox'
import DegreeCoursesTable from '../StudyProgramme/DegreeCourses'
import useCourseFilter from '../FilterTray/filters/Courses/useCourseFilter'
import info from '../../common/markdown/populationStatistics/coursesOfPopulation.info.md'

const PopulationCourses = ({
  populationSelectedStudentCourses,
  populationCourses,
  selectedStudents,
  query,
  filteredStudents
}) => {
  const { setCoursesOnce, resetCourses, runCourseQuery } = useCourseFilter()

  const selectedPopulationCourses = populationSelectedStudentCourses.data
    ? populationSelectedStudentCourses
    : populationCourses

  const { pending } = selectedPopulationCourses

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

  /**
   * These three hooks are required to make navigation work properly (context must be emptied
   * when unmounting this view.)
   */
  useEffect(() => {
    if (filteredStudents.length) {
      runCourseQuery(makeCourseQueryOpts())
    }
  }, [filteredStudents])

  useEffect(() => {
    const { pending, error, data } = selectedPopulationCourses
    if (!pending && !error) {
      setCoursesOnce(data.coursestatistics)
    }
  }, [selectedPopulationCourses.data])

  // Clear course filter data on unmount.
  useEffect(() => {
    return resetCourses
  }, [])

  return (
    <Segment basic>
      <FilterDegreeCoursesModal />
      <InfoBox content={info} />
      <SegmentDimmer isLoading={pending} />
      <PopulationCourseStats
        key={selectedPopulationCourses.query.uuid}
        courses={selectedPopulationCourses.data}
        query={selectedPopulationCourses.query}
        pending={pending}
        selectedStudents={selectedStudents}
      />
    </Segment>
  )

  function FilterDegreeCoursesModal() {
    const [open, setOpen] = useState(false)

    return (
      <Modal
        size="large"
        onOpen={() => setOpen(true)}
        open={open}
        trigger={
          <span style={{ marginRight: '1rem' }}>
            <Button basic icon labelPosition="left">
              <Icon name="eye" />
              Manage Courses Shown
            </Button>
          </span>
        }
      >
        <Modal.Header>Hide degree courses</Modal.Header>
        <Modal.Content image>
          <Modal.Description>
            <DegreeCoursesTable studyProgramme={query.studyRights.programme} />
            <Button onClick={() => setOpen(false)} icon labelPosition="left">
              <Icon name="save" />
              Save & Close
            </Button>
          </Modal.Description>
        </Modal.Content>
      </Modal>
    )
  }
}

PopulationCourses.defaultPropTypes = {
  query: {}
}

PopulationCourses.propTypes = {
  populationSelectedStudentCourses: shape({ query: shape({}), data: shape({}), pending: bool }).isRequired,
  populationCourses: shape({ query: shape({}), data: shape({}), pending: bool }).isRequired,
  selectedStudents: arrayOf(string).isRequired,
  query: shape({}).isRequired,
  filteredStudents: arrayOf(shape({})).isRequired
}

const mapStateToProps = ({ populationSelectedStudentCourses, populationCourses }) => ({
  populationCourses,
  populationSelectedStudentCourses
})

export default connect(mapStateToProps)(PopulationCourses)
