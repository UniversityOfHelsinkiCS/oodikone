import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Segment } from 'semantic-ui-react'
import { useGetProgressCriteriaQuery } from 'redux/programmeProgressCriteria'
import SegmentDimmer from '../SegmentDimmer'
import PopulationCourseStats from '../PopulationCourseStats'
import CustomPopulationCourses from '../CustomPopulation/CustomPopulationCourses'
import InfoBox from '../Info/InfoBox'
import FilterDegreeCoursesModal from './FilterDegreeCoursesModal'
import { getPopulationSelectedStudentCourses } from '../../redux/populationSelectedStudentCourses'
import infotooltips from '../../common/InfoToolTips'

const PopulationCourses = ({
  query = {},
  filteredStudents,
  selectedStudentsByYear,
  onlyIamRights,
  curriculum,
  courseTableMode,
}) => {
  const populationCourses = useSelector(({ populationCourses }) => populationCourses)
  const mandatoryCourses = curriculum
  const progressCriteria = useGetProgressCriteriaQuery({ programmeCode: query?.studyRights?.programme })

  const dispatch = useDispatch()
  const emptyCriteria = {
    courses: { yearOne: [], yearTwo: [], yearThree: [], yearFour: [], yearFive: [], yearSix: [] },
    credits: { yearOne: 0, yearTwo: 0, yearThree: 0, yearFour: 0, yearFive: 0, yearSix: 0 },
  }
  const [criteria, setCriteria] = useState(progressCriteria?.data ? progressCriteria.data : emptyCriteria)
  const populationSelectedStudentCourses = useSelector(
    ({ populationSelectedStudentCourses }) => populationSelectedStudentCourses
  )

  const queryHasBeenUpdated = () => {
    return populationSelectedStudentCourses.query.selectedStudents?.length === filteredStudents.length
  }

  const getSelectedStudents = students =>
    onlyIamRights
      ? students.map(({ studentNumber, iv }) => ({ encryptedData: studentNumber, iv }))
      : students.map(student => student.studentNumber)

  const fetch = courses => {
    dispatch(
      getPopulationSelectedStudentCourses({
        ...query,
        studyRights: [query.studyRights.programme],
        selectedStudents: getSelectedStudents(filteredStudents),
        selectedStudentsByYear,
        courses,
      })
    )
  }
  useEffect(() => {
    if (progressCriteria.data) {
      setCriteria(progressCriteria.data)
    }
  }, [progressCriteria.data])
  useEffect(() => {
    if (mandatoryCourses && !queryHasBeenUpdated() && !populationSelectedStudentCourses.pending) {
      // Mandatory courses is an object due to possibility of combined programmes (e.g. eläinlääkis)
      const mandatoryCourseCodes = mandatoryCourses.defaultProgrammeCourses.map(({ code }) => code)
      const mandatoryCourseCodesSecondProg = mandatoryCourses.secondProgrammeCourses.map(({ code }) => code)
      const programmeCodesToFetch = [...mandatoryCourseCodes, ...mandatoryCourseCodesSecondProg]
      fetch(programmeCodesToFetch)
    }
  }, [query, filteredStudents, curriculum, populationSelectedStudentCourses])

  if (!mandatoryCourses) return null

  const selectedPopulationCourses = populationSelectedStudentCourses.data
    ? populationSelectedStudentCourses
    : populationCourses

  const pending = populationSelectedStudentCourses.pending || populationCourses.pending

  return (
    <Segment basic>
      {courseTableMode === 'curriculum' ? (
        <InfoBox content={infotooltips.PopulationStatistics.CoursesOfClass} />
      ) : (
        <InfoBox content={infotooltips.PopulationStatistics.CoursesOfPopulation} />
      )}
      {query.studyRights.programme && !onlyIamRights && (
        <FilterDegreeCoursesModal
          studyProgramme={query.studyRights.programme}
          criteria={criteria}
          setCriteria={setCriteria}
        />
      )}
      <SegmentDimmer isLoading={pending} />
      {courseTableMode === 'curriculum' ? (
        <PopulationCourseStats
          key={selectedPopulationCourses.query.uuid}
          mandatoryCourses={mandatoryCourses}
          courses={selectedPopulationCourses.data}
          pending={pending}
          filteredStudents={filteredStudents}
          onlyIamRights={onlyIamRights}
        />
      ) : (
        <CustomPopulationCourses
          courses={pending ? null : selectedPopulationCourses.data}
          filteredStudents={filteredStudents}
          showFilter
        />
      )}
    </Segment>
  )
}

export default PopulationCourses
