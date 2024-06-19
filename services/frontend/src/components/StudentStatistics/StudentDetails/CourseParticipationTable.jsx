import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Divider, Header, Icon, Item, Label } from 'semantic-ui-react'

import { getTextInWithOpen } from '@/common'
import { reformatDate } from '@/common/timeAndDate'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { StudentCourseTable } from '@/components/StudentStatistics/StudentCourseTable'
import { DISPLAY_DATE_FORMAT } from '@/constants/date'

// Some courses are without AY in the beginning in the studyplan even though the credits are registered with AY.
const isInStudyPlan = (plan, code) =>
  plan && (plan.included_courses.includes(code) || plan.included_courses.includes(code.replace('AY', '')))

const getAcademicYear = date => {
  const year = new Date(date).getFullYear()
  const month = new Date(date).getMonth()
  // Months are 0-indexed so 7 means August...
  return month < 7 ? `${year - 1}-${year}` : `${year}-${year + 1}`
}

const getIcon = (credittypecode, isStudyModuleCredit, passed) => {
  if (isStudyModuleCredit) return <Icon color="purple" name="certificate" />
  if (credittypecode === 9) return <Icon color="green" name="clipboard check" title="Credit transfer" />
  return passed ? <Icon color="green" name="check" /> : <Icon color="red" name="times" />
}

export const CourseParticipationTable = ({ student, studyrightid }) => {
  const { getTextIn } = useLanguage()
  if (!student) return null

  const studyPlan = student?.studyplans.find(plan => plan.studyrightid === studyrightid)

  const courseRowsByAcademicYear = student.courses.reduceRight((acc, attainment) => {
    const { course, credits, credittypecode, date, grade, isOpenCourse, isStudyModuleCredit, passed } = attainment
    const isIncluded = isInStudyPlan(studyPlan, course.code)
    const academicYear = getAcademicYear(date)

    if (!acc[academicYear]) acc[academicYear] = []

    acc[academicYear].push([
      isIncluded,
      reformatDate(date, DISPLAY_DATE_FORMAT),
      <div
        key={`${course.code}-${new Date(date).getTime()}-course-${grade}`}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        {getTextInWithOpen(course, getTextIn, isOpenCourse, isStudyModuleCredit)}
        {credittypecode === 7 && (
          <Label content={getTextIn({ fi: 'TOISSIJAINEN', en: 'SECONDARY', sv: 'SEKUNDÄR' })} size="tiny" />
        )}
      </div>,
      <div key={`${course.code}-${new Date(date).getTime()}-grade-${grade}`}>
        {getIcon(credittypecode, isStudyModuleCredit, passed)}
        {grade}
      </div>,
      credits,
      <Item
        as={Link}
        key={`${course.code}-${new Date(date).getTime()}-link-${grade}`}
        to={`/coursestatistics?courseCodes=["${course.code}"]&separate=false&combineSubstitutions=true`}
      >
        <Icon name="level up alternate" />
      </Item>,
    ])
    return acc
  }, {})

  return (
    <>
      <Divider horizontal>
        <Header as="h4">Courses</Header>
      </Divider>
      {Object.entries(courseRowsByAcademicYear).map(([academicYear, courses]) => (
        <Fragment key={academicYear}>
          <Header content={academicYear} />
          <StudentCourseTable headers={['Date', 'Course', 'Grade', 'Credits', '']} rows={courses} />
        </Fragment>
      ))}
    </>
  )
}
