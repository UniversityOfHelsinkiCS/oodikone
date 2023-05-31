import React, { useMemo, useCallback } from 'react'
import _, { orderBy, uniqBy, sortBy, isNumber } from 'lodash'
import { useSelector } from 'react-redux'
import { Icon, Tab } from 'semantic-ui-react'
import useLanguage from 'components/LanguagePicker/useLanguage'
import '../../PopulationCourseStats/populationCourseStats.css'
import { useGetStudyGuidanceGroupPopulationCoursesQuery } from 'redux/studyGuidanceGroups'
import StudentInfoItem from 'components/common/StudentInfoItem'
import { hiddenNameAndEmailForCsv } from 'common'
import SortableTable, { row } from '../../SortableTable'
import '../populationStudents.css'

const getMandatoryPassed = (mandatoryCourses, populationCourses, studyGuidanceCourses) => {
  if (!mandatoryCourses || !mandatoryCourses.defaultProgrammeCourses || (!populationCourses && !studyGuidanceCourses))
    return {}
  const mandatoryCodes = [
    ...mandatoryCourses.defaultProgrammeCourses
      .filter(course => course.visible && course.visible.visibility)
      .map(c => c.code),
    ...mandatoryCourses.secondProgrammeCourses
      .filter(course => course.visible && course.visible.visibility)
      .map(c => c.code),
  ]

  let mandatoryPassed = {}
  const popCourses = populationCourses || studyGuidanceCourses
  if (popCourses.coursestatistics) {
    const courseStats = popCourses.coursestatistics
    mandatoryPassed = mandatoryCodes.reduce((obj, code) => {
      const foundCourse = !!courseStats.find(c => c.course.code === code)

      const passedArray = foundCourse ? Object.keys(courseStats.find(c => c.course.code === code).students.passed) : []
      obj[code] = passedArray
      return obj
    }, {})
  }
  return mandatoryPassed
}

const CoursesTable = ({ students, studyGuidanceCourses }) => {
  const { getTextIn } = useLanguage()
  const namesVisible = useSelector(state => state?.settings?.namesVisible)
  const mandatoryCourses = useSelector(({ populationMandatoryCourses }) => populationMandatoryCourses?.data)
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
      _.sumBy(mandatoryCourses.defaultProgrammeCourses, ({ code }) => hasPassedMandatory(studentNumber, code)) +
      _.sumBy(mandatoryCourses.secondProgrammeCourses, ({ code }) => hasPassedMandatory(studentNumber, code)),
    [mandatoryCourses, hasPassedMandatory]
  )

  const columns = useMemo(() => {
    const nameColumns = []

    nameColumns.push({
      key: 'studentnumber',
      title: 'Student Number',
      cellProps: { title: 'Student number' },
      getRowVal: s => (s.total ? '*' : s.studentNumber),
      getRowContent: s =>
        s.total ? 'Summary:' : <StudentInfoItem student={s} tab="Mandatory courses table" showSisuLink />,
      child: true,
    })

    if (namesVisible) {
      nameColumns.push(
        {
          key: 'lastname',
          title: 'Last name',
          getRowVal: s => (s.total ? null : s.lastname),
          cellProps: { title: 'last name' },
          child: true,
          export: false,
        },
        {
          key: 'firstname',
          title: 'Given names',
          getRowVal: s => (s.total ? null : s.firstnames),
          cellProps: { title: 'first names' },
          child: true,
          export: false,
        }
      )
    }

    nameColumns.push({
      key: 'totalpassed',
      title: 'Total Passed',
      filterType: 'range',
      vertical: true,
      getRowVal: s =>
        s.total
          ? Object.values(s)
              .filter(isNumber)
              .reduce((acc, e) => acc + e, 0)
          : totalMandatoryPassed(s.studentNumber),
      cellProps: { title: 'Total passed' },
      child: true,
    })

    const mandatoryCourseLabels = []
    // REVISIT ELÄINLÄÄKIS
    const labelToMandatoryCourses = mandatoryCourses.defaultProgrammeCourses
      ? mandatoryCourses.defaultProgrammeCourses.reduce((acc, e) => {
          const label = e.label ? e.label.label : ''
          acc[label] = acc[label] || []
          if (acc[label].some(l => l.code === e.code)) return acc
          acc[label].push(e)
          if (e.label) mandatoryCourseLabels.push({ ...e.label, code: e.label_code })
          else mandatoryCourseLabels.push({ id: 'null', label: '', code: '' })
          return acc
        }, {})
      : []

    const sortedlabels = orderBy(
      uniqBy(mandatoryCourseLabels, l => l.label),
      [e => e.orderNumber],
      ['asc']
    )

    const { visibleLabels, visibleCourseCodes } = mandatoryCourses.defaultProgrammeCourses
      ? mandatoryCourses.defaultProgrammeCourses.reduce(
          (acc, cur) => {
            if (cur.visible && cur.visible.visibility) {
              acc.visibleLabels.add(cur.label_code)
              acc.visibleCourseCodes.add(cur.code)
            }

            return acc
          },
          { visibleLabels: new Set(), visibleCourseCodes: new Set() }
        )
      : [{ visibleLabels: new Set(), visibleCourseCodes: new Set() }]

    const getTotalRowVal = (t, m) => t[m.code]

    const columns = []

    columns.push(
      {
        key: 'general',
        title: <b>Labels:</b>,
        textTitle: null,
        parent: true,
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
              cellProps: s => {
                let grade = s.courses
                  ? s.courses.find(course => course.course_code === m.code || course.course_code === `AY${m.code}`)
                      ?.grade
                  : null
                grade =
                  s.courses && !grade && hasPassedMandatory(s.studentNumber, m.code)
                    ? s.courses.find(course => course.course_code === m.label_code)?.grade
                    : grade
                const gradeText = grade ? `\nGrade: ${grade}` : ''
                const studentCode = s.studentNumber ? `\nStudent number:  ${s.studentNumber}` : ``
                return {
                  title: `${m.code}, ${getTextIn(m.name)}${studentCode} ${gradeText}`,
                  style: {
                    verticalAlign: 'middle',
                    textAlign: 'center',
                  },
                }
              },
              headerProps: { title: `${m.code}, ${getTextIn(m.name)}` },
              getRowVal: s => {
                if (s.total) {
                  return getTotalRowVal(s, m)
                }

                return hasPassedMandatory(s.studentNumber, m.code) ? 'Passed' : ''
              },
              getRowExportVal: s => {
                if (s.total) {
                  return getTotalRowVal(s, m)
                }

                return hasPassedMandatory(s.studentNumber, m.code) ? 'Passed' : ''
              },
              getRowContent: s => {
                if (s.total) return getTotalRowVal(s, m)
                return hasPassedMandatory(s.studentNumber, m.code) ? <Icon fitted name="check" color="green" /> : null
              },
              child: true,
              childOf: e.label,
              code: m.code,
            })),
        }))
    )

    return columns
  }, [namesVisible, mandatoryCourses, getTextIn])

  const data = useMemo(() => {
    const totals = students.reduce(
      (acc, s) => {
        const passedCourses = new Set()
        if (mandatoryCourses.defaultProgrammeCourses) {
          mandatoryCourses.defaultProgrammeCourses.forEach(m => {
            if (passedCourses.has(m.code)) return
            passedCourses.add(m.code)
            if (hasPassedMandatory(s.studentNumber, m.code)) ++acc[m.code]
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
  // ELÄINLÄÄKKIS REVISIT
  return (
    <Tab.Pane loading={pending}>
      <div style={{ display: 'flex' }}>
        <div style={{ maxHeight: '80vh', width: '100%' }}>
          {mandatoryCourses.defaultProgrammeCourses && mandatoryCourses.defaultProgrammeCourses.length > 0 && (
            <SortableTable
              tableId="course-of-population-students"
              title={`Courses of population's students`}
              getRowKey={s => (s.total ? 'totals' : s.studentNumber)}
              tableProps={{
                celled: true,
                compact: 'very',
                padded: false,
                collapsing: true,
                basic: true,
                striped: true,
                singleLine: true,
                //                textAlign: 'center',
              }}
              columns={columns}
              onlyExportColumns={hiddenNameAndEmailForCsv}
              data={data}
            />
          )}
        </div>
      </div>
    </Tab.Pane>
  )
}
// study guidance groups -feature uses different population + rtk query, so it needs to
// be rendered differently also here: TODO: refactor things nicely
const StudyGuidanceGroupCoursesTabContainer = ({ students, group }) => {
  const groupStudentNumbers = group?.members?.map(({ personStudentNumber }) => personStudentNumber) || []
  const populationsCourses = useGetStudyGuidanceGroupPopulationCoursesQuery(groupStudentNumbers).data
  if (populationsCourses.pending) return null
  return <CoursesTable students={students} studyGuidanceCourses={populationsCourses} />
}
const CoursesTabContainer = ({ students, variant, studyGuidanceGroup }) => {
  if (variant === 'studyGuidanceGroupPopulation') {
    return <StudyGuidanceGroupCoursesTabContainer students={students} group={studyGuidanceGroup} />
  }

  return <CoursesTable students={students} />
}

export default CoursesTabContainer
