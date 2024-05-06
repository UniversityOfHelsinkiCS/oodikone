import React, { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Divider, Header, Icon, Item } from 'semantic-ui-react'

import { byDateDesc, getTextInWithOpen, reformatDate } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { StudentCourseTable } from '@/components/StudentStatistics/StudentCourseTable'

// Some courses are without AY in the beginning in the studyplan even though the credits are registered with AY.
const isInStudyPlan = (plan, code) =>
  plan && (plan.included_courses.includes(code) || plan.included_courses.includes(code.replace('AY', '')))

export const CourseParticipationTable = ({ student, clearCourseStats, studyrightid }) => {
  const { language } = useLanguage()

  if (!student) return null
  const courseHeaders = ['Date', 'Course', 'Grade', 'Credits', '']

  const courseRowsByAcademicYear = {}

  const studyPlan = student?.studyplans.find(plan => plan.studyrightid === studyrightid)

  student.courses.toSorted(byDateDesc).forEach(studentCourse => {
    const { course, credits, credittypecode, date, grade, isOpenCourse, isStudyModuleCredit, passed } = studentCourse
    const isIncluded = isInStudyPlan(studyPlan, course.code)

    let icon = null

    if (isStudyModuleCredit) {
      icon = <Icon color="purple" name="certificate" />
    } else if (credittypecode === 9) {
      icon = <Icon color="green" name="clipboard check" title="Credit transfer" />
    } else if (passed) {
      icon = <Icon color="green" name="check" />
    } else {
      icon = <Icon color="red" name="times" />
    }

    if (!courseRowsByAcademicYear[`${new Date(date).getFullYear()}-${new Date(date).getFullYear() + 1}`]) {
      courseRowsByAcademicYear[`${new Date(date).getFullYear()}-${new Date(date).getFullYear() + 1}`] = []
    }
    if (!courseRowsByAcademicYear[`${new Date(date).getFullYear() - 1}-${new Date(date).getFullYear()}`]) {
      courseRowsByAcademicYear[`${new Date(date).getFullYear() - 1}-${new Date(date).getFullYear()}`] = []
    }

    if (new Date(date).getMonth() < 7) {
      courseRowsByAcademicYear[`${new Date(date).getFullYear() - 1}-${new Date(date).getFullYear()}`].push([
        isIncluded,
        reformatDate(date, 'DD.MM.YYYY'),
        `${
          isStudyModuleCredit
            ? `${getTextInWithOpen(course.name, language, isOpenCourse)} [Study Module]`
            : getTextInWithOpen(course.name, language, isOpenCourse)
        } ${credittypecode === 7 ? ` (${course.code}) (korotettu)` : `(${course.code})`}`,
        <div key={`${course.code}-${new Date(date).getTime()}-grade-${grade}`}>
          {icon}
          {grade}
        </div>,
        credits,
        <Item
          as={Link}
          key={`${course.code}-${new Date(date).getTime()}-link-${grade}`}
          to={`/coursestatistics?courseCodes=["${course.code}"]&separate=false&unifyOpenUniCourses=false`}
        >
          <Icon name="level up alternate" onClick={() => clearCourseStats()} />
        </Item>,
      ])
    } else {
      courseRowsByAcademicYear[`${new Date(date).getFullYear()}-${new Date(date).getFullYear() + 1}`].push([
        isIncluded,
        reformatDate(date, 'DD.MM.YYYY'),
        `${
          isStudyModuleCredit
            ? `${getTextInWithOpen(course.name, language, isOpenCourse)} [Study Module]`
            : getTextInWithOpen(course.name, language, isOpenCourse)
        } ${credittypecode === 7 ? `, ${course.code} (korotettu)` : `(${course.code})`}`,
        <div key={`${course.code}-${new Date(date).getTime()}-grade-${grade}`}>
          {icon}
          {grade}
        </div>,
        credits,
        <Item
          as={Link}
          key={`${course.code}-${new Date(date).getTime()}-link-${grade}`}
          to={`/coursestatistics?courseCodes=["${course.code}"]&separate=false&unifyOpenUniCourses=false`}
        >
          <Icon name="level up alternate" onClick={() => clearCourseStats()} />
        </Item>,
      ])
    }
  })

  const courseTables = Object.keys(courseRowsByAcademicYear).map(academicYear => {
    if (courseRowsByAcademicYear[academicYear] < 1) return null

    return (
      <Fragment key={academicYear}>
        <Header content={academicYear} />
        <StudentCourseTable headers={courseHeaders} rows={courseRowsByAcademicYear[academicYear]} />
      </Fragment>
    )
  })

  return (
    <>
      <Divider horizontal>
        <Header as="h4">Courses</Header>
      </Divider>
      {courseTables}
    </>
  )
}
