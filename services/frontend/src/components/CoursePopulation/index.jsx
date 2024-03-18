import _ from 'lodash'
import moment from 'moment'
import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Form, Header, Input, Segment } from 'semantic-ui-react'
import { getStudentToTargetCourseDateMap, getUnifyTextIn } from '@/common'
import { useProgress, useTitle } from '@/common/hooks'
import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { queryParamsFromUrl } from '@/common/query'
import { PanelView } from '@/components/common/PanelView'
import { CustomPopulationProgrammeDist } from '@/components/CustomPopulation/CustomPopulationProgrammeDist'
import { FilterView } from '@/components/FilterView'
import {
  ageFilter,
  courseFilter,
  creditsEarnedFilter,
  genderFilter,
  gradeFilter,
  programmeFilter,
  startYearAtUniFilter,
  studentNumberFilter,
  studyTrackFilter,
} from '@/components/FilterView/filters'
import { InfoBox } from '@/components/Info/InfoBox'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { PopulationCourseStatsFlat } from '@/components/PopulationCourseStats/PopulationCourseStatsFlat'
import { PopulationStudentsContainer as PopulationStudents } from '@/components/PopulationStudents'
import { ProgressBar } from '@/components/ProgressBar'
import { useGetStudentListCourseStatisticsQuery } from '@/redux/populationCourses'
import { useGetPopulationStatisticsByCourseQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'
import { useGetSingleCourseStatsQuery } from '@/redux/singleCourseStats'
import { CoursePopulationCreditGainTable } from './CoursePopulationCreditGainTable'
import { CoursePopulationGradeDist } from './CoursePopulationGradeDist'
import { CoursePopulationLanguageDist } from './CoursePopulationLanguageDist'

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
            courseCodes={codes}
            from={dateFrom}
            singleCourseStats={courseData}
            students={filtered}
            to={dateTo}
          />
        </div>
      ),
    },
    {
      title: 'Language distribution',
      content: (
        <div>
          <InfoBox content={populationStatisticsToolTips.LanguageDistributionCoursePopulation} />
          <CoursePopulationLanguageDist codes={codes} from={dateFrom} samples={filtered} to={dateTo} />
        </div>
      ),
    },
    {
      title: 'Programme distribution',
      content: (
        <div>
          <InfoBox content={populationStatisticsToolTips.ProgrammeDistributionCoursePopulation} />
          <CustomPopulationProgrammeDist
            coursecode={codes}
            from={dateFrom}
            studentData={populationStatistics}
            studentToTargetCourseDateMap={studentToTargetCourseDateMap}
            students={filtered}
            to={dateTo}
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
          codes={codes}
          from={dateFrom}
          populationStatistics={populationStatistics}
          studentToTargetCourseDateMap={studentToTargetCourseDateMap}
          students={filtered}
          to={dateTo}
        />
      ),
    },
    {
      title: `Students (${filtered.length})`,
      content: (
        <PopulationStudents
          coursecode={codes}
          filteredStudents={filtered}
          from={dateFrom}
          studentToTargetCourseDateMap={studentToTargetCourseDateMap}
          to={dateTo}
          variant="coursePopulation"
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
      name="CoursePopulation"
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
            onChange={event => onStudentAmountLimitChange(event.target.value)}
            style={{ width: '70px' }}
            value={studentAmountLimit}
          />
        </Form.Field>
      </Form>
      <PopulationCourseStatsFlat
        courses={courseStatistics}
        filteredStudents={filteredStudents}
        studentAmountLimit={studentAmountLimit}
      />
    </>
  )
}
