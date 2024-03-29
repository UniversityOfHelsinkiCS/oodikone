import _, { isNumber, orderBy, sortBy, uniqBy } from 'lodash'
import React, { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Icon, Tab } from 'semantic-ui-react'

import { hiddenNameAndEmailForExcel } from '@/common/columns'
import { StudentInfoItem } from '@/components/common/StudentInfoItem'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable, row } from '@/components/SortableTable'
import '@/components/PopulationCourseStats/populationCourseStats.css'
import '@/components/PopulationStudents/populationStudents.css'
import { useGetStudyGuidanceGroupPopulationCoursesQuery } from '@/redux/studyGuidanceGroups'

const getMandatoryPassed = (mandatoryCourses, populationCourses, studyGuidanceCourses) => {
  if (!mandatoryCourses || !mandatoryCourses.defaultProgrammeCourses || (!populationCourses && !studyGuidanceCourses))
    return {}
  const mandatoryCodes = [
    ...mandatoryCourses.defaultProgrammeCourses
      .filter(course => course.visible && course.visible.visibility)
      .map(course => course.code),
    ...mandatoryCourses.secondProgrammeCourses
      .filter(course => course.visible && course.visible.visibility)
      .map(course => course.code),
  ]

  let mandatoryPassed = {}
  const popCourses = populationCourses || studyGuidanceCourses
  if (popCourses?.coursestatistics) {
    const courseStats = popCourses.coursestatistics
    mandatoryPassed = mandatoryCodes.reduce((obj, code) => {
      const foundCourse = !!courseStats.find(course => course.course.code === code)

      const passedArray = foundCourse
        ? Object.keys(courseStats.find(course => course.course.code === code).students.passed)
        : []
      obj[code] = passedArray
      return obj
    }, {})
  }
  return mandatoryPassed
}

const CoursesTable = ({ students, studyGuidanceCourses, curriculum }) => {
  const { getTextIn } = useLanguage()
  const namesVisible = useSelector(state => state?.settings?.namesVisible)
  const mandatoryCourses = curriculum
  const { data: populationCourses, pending } = useSelector(state => state?.populationSelectedStudentCourses)
  const mandatoryPassed = useMemo(
    () => getMandatoryPassed(mandatoryCourses, populationCourses, studyGuidanceCourses),
    [mandatoryCourses, populationCourses, studyGuidanceCourses]
  )

  const hasPassedMandatory = useCallback(
    (studentNumber, code) => mandatoryPassed[code] && mandatoryPassed[code].includes(studentNumber),
    [mandatoryPassed]
  )

  const totalMandatoryPassed = useCallback(
    studentNumber =>
      _.sumBy(Array.from(new Set(mandatoryCourses.defaultProgrammeCourses.map(({ code }) => code))), code =>
        hasPassedMandatory(studentNumber, code)
      ) +
      _.sumBy(Array.from(new Set(mandatoryCourses.secondProgrammeCourses.map(({ code }) => code))), code =>
        hasPassedMandatory(studentNumber, code)
      ),
    [mandatoryCourses, hasPassedMandatory]
  )

  const columns = useMemo(() => {
    const nameColumns = []

    nameColumns.push({
      key: 'studentnumber',
      title: 'Student Number',
      cellProps: { title: 'Student number' },
      getRowVal: student => (student.total ? '*' : student.studentNumber),
      getRowContent: student =>
        student.total ? 'Summary:' : <StudentInfoItem showSisuLink student={student} tab="Mandatory courses table" />,
    })

    if (namesVisible) {
      nameColumns.push(
        {
          key: 'lastname',
          title: 'Last name',
          getRowVal: student => (student.total ? null : student.lastname),
          cellProps: { title: 'last name' },
          export: false,
        },
        {
          key: 'firstname',
          title: 'Given names',
          getRowVal: student => (student.total ? null : student.firstnames),
          cellProps: { title: 'first names' },
          export: false,
        }
      )
    }

    nameColumns.push({
      key: 'totalpassed',
      title: 'Total Passed',
      filterType: 'range',
      vertical: true,
      getRowVal: student =>
        student.total
          ? Object.values(student)
              .filter(isNumber)
              .reduce((acc, e) => acc + e, 0)
          : totalMandatoryPassed(student.studentNumber),
      cellProps: { title: 'Total passed' },
    })

    const mandatoryCourseLabels = []
    const defaultCourses = mandatoryCourses?.defaultProgrammeCourses || []
    const combinedCourses = mandatoryCourses?.secondProgrammeCourses || []
    const coursesList = [...defaultCourses, ...combinedCourses]
    const labelToMandatoryCourses = coursesList.reduce((acc, e) => {
      const label = e.label ? e.label.label : ''
      acc[label] = acc[label] || []
      if (acc[label].some(l => l.code === e.code)) return acc
      acc[label].push(e)
      if (e.label) mandatoryCourseLabels.push({ ...e.label, code: e.parent_code })
      else mandatoryCourseLabels.push({ id: 'null', label: '', code: '' })
      return acc
    }, {})

    const sortedlabels = orderBy(
      uniqBy(mandatoryCourseLabels, l => l.label),
      [e => e.orderNumber],
      ['asc']
    )

    const { visibleLabels, visibleCourseCodes } = coursesList.reduce(
      (acc, cur) => {
        if (cur.visible && cur.visible.visibility) {
          acc.visibleLabels.add(cur.parent_code)
          acc.visibleCourseCodes.add(cur.code)
        }

        return acc
      },
      { visibleLabels: new Set(), visibleCourseCodes: new Set() }
    )

    const getTotalRowVal = (t, m) => t[m.code]

    const findBestGrade = (courses, code) => {
      const course = populationCourses?.coursestatistics?.find(course => course.course.code === code)
      if (!course) return null
      const { substitutions } = course.course
      const courseAttainments = courses.filter(
        course =>
          [code, `AY${code}`, `A${code}`].includes(course.course_code) ||
          substitutions.some(sub =>
            [sub, `AY${sub}`, sub.startsWith('A') && sub.substring(1)].includes(course.course_code)
          )
      )

      const bestGrade =
        courseAttainments.length > 0
          ? sortBy(courseAttainments, element => {
              const order = { 5: 0, 4: 1, 3: 2, 2: 3, 1: 4, HT: 5, TT: 6, 'Hyv.': 7, 'Hyl.': 8 }
              return order[element.grade]
            })[0].grade
          : null

      return bestGrade
    }

    const columns = []

    columns.push(
      {
        key: 'general',
        title: <b>Labels:</b>,
        textTitle: null,
        children: nameColumns,
      },
      ...sortedlabels
        .filter(({ code }) => visibleLabels.has(code))
        .map(e => ({
          key: e.id + e.code,
          title: (
            <div key={e.code} style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
              <div key={`${e.code}-${e.id}`}>{e.code}</div>
              <div key={`${e.code}${e.id}`} style={{ color: 'gray', fontWeight: 'normal' }}>
                {e.id}
              </div>
            </div>
          ),
          textTitle: e.code,
          thickBorders: true,
          children: sortBy(labelToMandatoryCourses[e.label], [
            m => {
              const res = m.code.match(/\d+/)
              return res ? Number(res[0]) : Number.MAX_VALUE
            },
            'code',
          ])
            .filter(course => visibleCourseCodes.has(course.code))
            .map(m => ({
              key: `${m.label ? m.label.label : 'fix'}-${m.code}`, // really quick and dirty fix
              title: (
                <div
                  key={`${m.code}-${m.label ? m.label.label : 'fix'}`}
                  style={{ maxWidth: '15em', whiteSpace: 'normal', overflow: 'hidden', width: 'max-content' }}
                >
                  <div key={`${m.label ? m.label.label : 'fix'}-${m.code}`}>{m.code}</div>
                  <div
                    key={`${m.label ? m.label.label : 'fix'}-${getTextIn(m.name)}`}
                    style={{ color: 'gray', fontWeight: 'normal' }}
                  >
                    {getTextIn(m.name)}
                  </div>
                </div>
              ),
              textTitle: m.code,
              vertical: true,
              forceToolsMode: 'dangling',
              cellProps: student => {
                if (!student.courses) return null
                const bestGrade = findBestGrade(student.courses, m.code)
                const gradeText = bestGrade ? `\nGrade: ${bestGrade}` : ''
                const studentCode = student.studentNumber ? `\nStudent number:  ${student.studentNumber}` : ''
                return {
                  title: `${m.code}, ${getTextIn(m.name)}${studentCode} ${gradeText}`,
                  style: {
                    verticalAlign: 'middle',
                    textAlign: 'center',
                  },
                }
              },
              headerProps: { title: `${m.code}, ${getTextIn(m.name)}` },
              getRowVal: student => {
                if (student.total) return getTotalRowVal(student, m)

                return hasPassedMandatory(student.studentNumber, m.code) ? 'Passed' : ''
              },
              getRowExportVal: student => {
                if (student.total) return getTotalRowVal(student, m)

                const bestGrade = findBestGrade(student.courses, m.code)

                if (!bestGrade) {
                  if (
                    student.enrollments &&
                    student.enrollments.some(
                      enrollment => enrollment.course_code === m.code && enrollment.state === 'ENROLLED'
                    )
                  ) {
                    return 0
                  }
                  return ''
                }

                if (bestGrade === 'Hyl.') return 0
                if (['1', '2', '3', '4', '5'].includes(bestGrade)) return parseInt(bestGrade, 10)
                return bestGrade
              },
              getRowContent: student => {
                if (student.total) return getTotalRowVal(student, m)
                return hasPassedMandatory(student.studentNumber, m.code) ? (
                  <Icon color="green" fitted name="check" />
                ) : null
              },
              code: m.code,
            })),
        }))
    )

    return columns
  }, [namesVisible, mandatoryCourses, getTextIn])

  const data = useMemo(() => {
    const totals = students.reduce(
      (acc, student) => {
        const passedCourses = new Set()
        if (mandatoryCourses.defaultProgrammeCourses) {
          mandatoryCourses.defaultProgrammeCourses.forEach(m => {
            if (passedCourses.has(m.code)) return
            passedCourses.add(m.code)
            if (hasPassedMandatory(student.studentNumber, m.code)) ++acc[m.code]
          })
        }
        return acc
      },
      mandatoryCourses.defaultProgrammeCourses
        ? mandatoryCourses.defaultProgrammeCourses.reduce((acc, e) => ({ ...acc, [e.code]: 0 }), { total: true })
        : { total: true }
    )

    return [row(totals, { ignoreFilters: true, ignoreSorting: true }), ...students]
  }, [students, mandatoryCourses, hasPassedMandatory, mandatoryPassed])
  return (
    <Tab.Pane loading={pending}>
      <div style={{ display: 'flex' }}>
        <div style={{ maxHeight: '80vh', width: '100%' }}>
          {mandatoryCourses?.defaultProgrammeCourses.length > 0 && (
            <SortableTable
              columns={columns}
              data={data}
              featureName="courses"
              firstColumnSticky
              onlyExportColumns={hiddenNameAndEmailForExcel}
              tableId="course-of-population-students"
              title="Courses of population'student students"
            />
          )}
        </div>
      </div>
    </Tab.Pane>
  )
}

// study guidance groups -feature uses different population + rtk query, so it needs to
// be rendered differently also here: TODO: refactor things nicely
const StudyGuidanceGroupCoursesTabContainer = ({ students, group, curriculum }) => {
  const groupStudentNumbers = group?.members?.map(({ personStudentNumber }) => personStudentNumber) || []
  const populationsCourses = useGetStudyGuidanceGroupPopulationCoursesQuery({
    studentnumberlist: groupStudentNumbers,
    year: group?.tags?.year,
  }).data
  if (populationsCourses.pending) return null
  return <CoursesTable curriculum={curriculum} students={students} studyGuidanceCourses={populationsCourses} />
}

export const CoursesTabContainer = ({ students, variant, studyGuidanceGroup, curriculum }) => {
  if (variant === 'studyGuidanceGroupPopulation') {
    return (
      <StudyGuidanceGroupCoursesTabContainer curriculum={curriculum} group={studyGuidanceGroup} students={students} />
    )
  }

  return <CoursesTable curriculum={curriculum} students={students} />
}
