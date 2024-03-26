import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Segment } from 'semantic-ui-react'

import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { InfoBox } from '@/components/Info/InfoBox'
import { ConnectedPopulationCourseStats as PopulationCourseStats } from '@/components/PopulationCourseStats'
import { PopulationCourseStatsFlat } from '@/components/PopulationCourseStats/PopulationCourseStatsFlat'
import { SegmentDimmer } from '@/components/SegmentDimmer'
import { getPopulationSelectedStudentCourses } from '@/redux/populationSelectedStudentCourses'
import { FilterDegreeCoursesModal } from './FilterDegreeCoursesModal'

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
      <div style={{ display: 'flex' }}>
        {courseTableMode === 'curriculum' ? (
          <div style={{ marginBottom: '20px', marginRight: '10px' }}>
            <InfoBox content={populationStatisticsToolTips.CoursesOfClass} />
          </div>
        ) : (
          <div style={{ marginBottom: '20px', marginRight: '10px' }}>
            <InfoBox content={populationStatisticsToolTips.CoursesOfPopulation} />
          </div>
        )}
        {query.studyRights.programme && !onlyIamRights && (
          <div style={{ marginBottom: '20px' }}>
            <FilterDegreeCoursesModal studyProgramme={query.studyRights.programme} year={query.year} />
          </div>
        )}
      </div>
      <SegmentDimmer isLoading={pending} />
      {courseTableMode === 'curriculum' ? (
        <PopulationCourseStats
          courses={populationSelectedStudentCourses.data ?? []}
          filteredStudents={filteredStudents}
          key={populationSelectedStudentCourses.query.uuid}
          mandatoryCourses={mandatoryCourses}
          onlyIamRights={onlyIamRights}
          pending={pending}
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
