import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Segment } from 'semantic-ui-react'

import { PopulationCourseStatsFlat } from 'components/PopulationCourseStats/PopulationCourseStatsFlat'
import { populationStatisticsToolTips } from 'common/InfoToolTips'
import { SegmentDimmer } from '../SegmentDimmer'
import { ConnectedPopulationCourseStats as PopulationCourseStats } from '../PopulationCourseStats'
import { InfoBox } from '../Info/InfoBox'
import { FilterDegreeCoursesModal } from './FilterDegreeCoursesModal'
import { getPopulationSelectedStudentCourses } from '../../redux/populationSelectedStudentCourses'

export const PopulationCourses = ({
  query = {},
  filteredStudents,
  selectedStudentsByYear,
  onlyIamRights,
  curriculum: mandatoryCourses,
  courseTableMode,
  studentAmountLimit,
}) => {
  const dispatch = useDispatch()
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
    if (mandatoryCourses && !queryHasBeenUpdated() && !populationSelectedStudentCourses.pending) {
      // Mandatory courses is an object due to possibility of combined programmes (e.g. eläinlääkis)
      const mandatoryCourseCodes = mandatoryCourses.defaultProgrammeCourses.map(({ code }) => code)
      const mandatoryCourseCodesSecondProg = mandatoryCourses.secondProgrammeCourses.map(({ code }) => code)
      const programmeCodesToFetch = [...mandatoryCourseCodes, ...mandatoryCourseCodesSecondProg]
      fetch(programmeCodesToFetch)
    }
  }, [query, filteredStudents, mandatoryCourses, populationSelectedStudentCourses])

  const pending = populationSelectedStudentCourses.pending || !mandatoryCourses

  return (
    <Segment basic>
      {courseTableMode === 'curriculum' ? (
        <InfoBox content={populationStatisticsToolTips.CoursesOfClass} />
      ) : (
        <InfoBox content={populationStatisticsToolTips.CoursesOfPopulation} />
      )}
      {query.studyRights.programme && !onlyIamRights && (
        <FilterDegreeCoursesModal studyProgramme={query.studyRights.programme} year={query.year} />
      )}
      <SegmentDimmer isLoading={pending} />
      {courseTableMode === 'curriculum' ? (
        <PopulationCourseStats
          key={populationSelectedStudentCourses.query.uuid}
          mandatoryCourses={mandatoryCourses}
          courses={populationSelectedStudentCourses.data ?? []}
          pending={pending}
          filteredStudents={filteredStudents}
          onlyIamRights={onlyIamRights}
        />
      ) : (
        <PopulationCourseStatsFlat
          courses={pending ? null : populationSelectedStudentCourses.data ?? []}
          filteredStudents={filteredStudents}
          studentAmountLimit={studentAmountLimit}
        />
      )}
    </Segment>
  )
}
