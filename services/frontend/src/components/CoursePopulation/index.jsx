import React, { useEffect, useState, useMemo } from 'react'
import moment from 'moment'
import _ from 'lodash'
import { Segment, Header, Form, Input } from 'semantic-ui-react'
import { useLocation } from 'react-router-dom'

import { InfoBox } from 'components/Info/InfoBox'
import { PopulationCourseStatsFlat } from 'components/PopulationCourseStats/PopulationCourseStatsFlat'
import { PanelView } from 'components/common/PanelView'
import { useGetPopulationStatisticsByCourseQuery } from 'redux/populations'
import { useGetSingleCourseStatsQuery } from 'redux/singleCourseStats'
import { useGetStudentListCourseStatisticsQuery } from 'redux/populationCourses'
import { useGetSemestersQuery } from 'redux/semesters'
import { populationStatisticsToolTips } from 'common/InfoToolTips'
import { getStudentToTargetCourseDateMap, getUnifyTextIn } from 'common'
import { useProgress, useTitle } from 'common/hooks'
import { queryParamsFromUrl } from 'common/query'
import { PopulationStudentsContainer as PopulationStudents } from '../PopulationStudents'
import { CoursePopulationGradeDist } from './CoursePopulationGradeDist'
import { CoursePopulationLanguageDist } from './CoursePopulationLanguageDist'
import { CoursePopulationCreditGainTable } from './CoursePopulationCreditGainTable'
import { CustomPopulationProgrammeDist } from '../CustomPopulation/CustomPopulationProgrammeDist'
import { ProgressBar } from '../ProgressBar'
import {
  ageFilter,
  gradeFilter,
  genderFilter,
  courseFilter,
  creditsEarnedFilter,
  startYearAtUniFilter,
  programmeFilter,
  studyTrackFilter,
  studentNumberFilter,
} from '../FilterView/filters'
import { FilterView } from '../FilterView'
import { useLanguage } from '../LanguagePicker/useLanguage'

const NO_PROGRAMME = {
  code: '00000',
  name: { en: 'No programme', fi: 'Ei ohjelmaa' },
  startdate: '',
}

export const CoursePopulation = () => {
  const location = useLocation()
  const { getTextIn } = useLanguage()
  const [codes, setCodes] = useState([])
  useTitle('Course population')

  const { coursecodes, from, to, separate, unifyCourses, years, years2, combineSubstitutions } =
    queryParamsFromUrl(location)

  const { data: populationStatistics, isFetching } = useGetPopulationStatisticsByCourseQuery({
    coursecodes,
    from,
    to,
    separate,
    unifyCourses,
  })

  useEffect(() => {
    const parsedCourseCodes = JSON.parse(coursecodes)
    setCodes(parsedCourseCodes)
  }, [coursecodes])

  const { progress } = useProgress(isFetching)
  const studentToTargetCourseDateMap = useMemo(
    () => getStudentToTargetCourseDateMap(populationStatistics?.students ?? [], codes),
    [populationStatistics?.students, codes]
  )

  const { data: courseStatistics } = useGetStudentListCourseStatisticsQuery(
    { studentNumbers: populationStatistics ? populationStatistics.students.map(student => student.studentNumber) : [] },
    { skip: !populationStatistics }
  )

  const { data: semesters = {} } = useGetSemestersQuery()

  const { data: [courseData = undefined] = [] } = useGetSingleCourseStatsQuery(
    { courseCodes: codes, separate, combineSubstitutions },
    { skip: codes.length === 0 }
  )

  const getFromToDates = (from, to, separate) => {
    if (!semesters.years || !semesters.semesters) return {}
    const targetProp = separate ? 'semestercode' : 'yearcode'
    const data = separate ? semesters.semesters : semesters.years
    const dataValues = Object.values(data)
    const findDateByCode = code => dataValues.find(d => d[targetProp] === code)

    return {
      dateFrom: findDateByCode(Number(from)).startdate,
      dateTo: findDateByCode(Number(to)).enddate,
    }
  }

  const { dateFrom, dateTo } = getFromToDates(from, to, separate ? JSON.parse(separate) : false)

  const header = courseData
    ? `${getTextIn(courseData[unifyCourses].name)} ${years || years2} ${getUnifyTextIn(unifyCourses)}`
    : null

  const subHeader = codes.join(', ')

  if (!populationStatistics || !semesters) {
    return (
      <Segment className="contentSegment">
        <ProgressBar progress={progress} />
      </Segment>
    )
  }

  const createPanels = filtered => [
    {
      title: 'Grade distribution',
      content: (
        <div>
          <InfoBox content={populationStatisticsToolTips.GradeDistributionCoursePopulation} />
          <CoursePopulationGradeDist
            singleCourseStats={courseData}
            from={dateFrom}
            to={dateTo}
            students={filtered}
            courseCodes={codes}
          />
        </div>
      ),
    },
    {
      title: 'Language distribution',
      content: (
        <div>
          <InfoBox content={populationStatisticsToolTips.LanguageDistributionCoursePopulation} />
          <CoursePopulationLanguageDist from={dateFrom} to={dateTo} samples={filtered} codes={codes} />
        </div>
      ),
    },
    {
      title: 'Programme distribution',
      content: (
        <div>
          <InfoBox content={populationStatisticsToolTips.ProgrammeDistributionCoursePopulation} />
          <CustomPopulationProgrammeDist
            studentToTargetCourseDateMap={studentToTargetCourseDateMap}
            students={filtered}
            coursecode={codes}
            studentData={populationStatistics}
          />
        </div>
      ),
    },
    {
      title: 'Courses of population',
      content: <CustomPopulationCoursesWrapper courseStatistics={courseStatistics} filteredStudents={filtered} />,
    },
    {
      title: 'Credit gains',
      content: (
        <CoursePopulationCreditGainTable
          studentToTargetCourseDateMap={studentToTargetCourseDateMap}
          students={filtered}
          codes={codes}
          from={dateFrom}
          to={dateTo}
          populationStatistics={populationStatistics}
        />
      ),
    },
    {
      title: `Students (${filtered.length})`,
      content: (
        <PopulationStudents
          variant="coursePopulation"
          studentToTargetCourseDateMap={studentToTargetCourseDateMap}
          filteredStudents={filtered}
          coursecode={codes}
          from={dateFrom}
          to={dateTo}
        />
      ),
    },
  ]

  const studyRightPredicate = (student, sre) => {
    const date = _.chain(student)
      .get('courses')
      .filter(c => codes.includes(c.course_code))
      .map('date')
      .max()
      .value()

    return sre.code === NO_PROGRAMME.code || moment(date).isBetween(sre.startdate, sre.enddate, 'day', '[]')
  }

  return (
    <FilterView
      name="CoursePopulation"
      filters={[
        genderFilter,
        studentNumberFilter,
        ageFilter,
        courseFilter({ courses: courseStatistics?.coursestatistics }),
        creditsEarnedFilter,
        startYearAtUniFilter,
        programmeFilter({
          additionalModes: [
            {
              key: 'attainment',
              label: 'Attainment',
              predicate: studyRightPredicate,
              description: 'Student had an active study right at the time of course attainment.',
            },
          ],
        }),
        gradeFilter({
          courseCodes: codes,
          from: dateFrom,
          to: dateTo,
        }),
        studyTrackFilter({
          activeAt: dateFrom,
        }),
      ]}
      initialOptions={{
        [programmeFilter.key]: { mode: 'attainment', selectedProgrammes: [] },
      }}
      students={populationStatistics.students ?? []}
    >
      {filtered => (
        <div className="segmentContainer">
          <Segment className="contentSegment">
            <Header className="segmentTitle" size="large" textAlign="center">
              Population of course {header}
            </Header>
            <Header className="segmentTitle" size="medium" textAlign="center">
              {subHeader}
            </Header>
            <PanelView panels={createPanels(filtered)} viewTitle="coursepopulation" />
          </Segment>
        </div>
      )}
    </FilterView>
  )
}

const CustomPopulationCoursesWrapper = ({ filteredStudents }) => {
  const { data: courseStatistics, isLoading } = useGetStudentListCourseStatisticsQuery({
    studentNumbers: filteredStudents.map(student => student.studentNumber),
  })

  const [studentAmountLimit, setStudentAmountLimit] = useState(0)

  useEffect(() => {
    setStudentAmountLimit(Math.round(filteredStudents.length ? filteredStudents.length * 0.3 : 0))
  }, [filteredStudents.length])

  const onStudentAmountLimitChange = value => {
    setStudentAmountLimit(Number.isNaN(Number(value)) ? studentAmountLimit : Number(value))
  }

  if (isLoading) return null

  return (
    <>
      <InfoBox content={populationStatisticsToolTips.CoursesOfPopulation} />
      <Form style={{ padding: '4px 4px 4px 8px' }}>
        <Form.Field inline>
          <label>Limit to courses where student number is at least</label>
          <Input
            value={studentAmountLimit}
            onChange={e => onStudentAmountLimitChange(e.target.value)}
            style={{ width: '70px' }}
          />
        </Form.Field>
      </Form>
      <PopulationCourseStatsFlat
        filteredStudents={filteredStudents}
        studentAmountLimit={studentAmountLimit}
        courses={courseStatistics}
      />
    </>
  )
}
