import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import _, { orderBy, uniqBy, sortBy, isNumber } from 'lodash'
import { useSelector, useDispatch } from 'react-redux'
import { Icon, Tab, Grid, Item, Dropdown } from 'semantic-ui-react'
import { Link } from 'react-router-dom'

import scrollToComponent from 'react-scroll-to-component'
import { useGetAuthorizedUserQuery } from 'redux/auth'
import useLanguage from 'components/LanguagePicker/useLanguage'
import { useTabChangeAnalytics, usePrevious } from '../../common/hooks'

import { getTagsByStudytrackAction } from '../../redux/tags'
import { getStudentTagsByStudytrackAction } from '../../redux/tagstudent'

import StudentNameVisibilityToggle from '../StudentNameVisibilityToggle'
import '../PopulationCourseStats/populationCourseStats.css'
import SortableTable, { row } from '../SortableTable'
import InfoBox from '../Info/InfoBox'
import CheckStudentList from './CheckStudentList'
import TagPopulation from '../TagPopulation'
import TagList from '../TagList'
import './populationStudents.css'
import GeneralTab from './StudentTable/GeneralTab'
import sendEvent, { ANALYTICS_CATEGORIES } from '../../common/sendEvent'
import infotoolTips from '../../common/InfoToolTips'

const sendAnalytics = sendEvent.populationStudents

const getMandatoryPassed = (mandatoryCourses, populationCourses) => {
  if (!mandatoryCourses || !populationCourses) return {}
  const mandatoryCodes = mandatoryCourses.filter(course => course.visible && course.visible.visibility).map(c => c.code)
  let mandatoryPassed = {}

  if (populationCourses.coursestatistics) {
    const mandatorycodesMapCourseCodeToCourseID = new Map()
    mandatoryCourses
      .filter(course => course.visible && course.visible.visibility)
      .forEach(c => mandatorycodesMapCourseCodeToCourseID.set(c.code, c.id))

    const courses = populationCourses.coursestatistics
    mandatoryPassed = mandatoryCodes.reduce((obj, code) => {
      const foundCourse = !!courses.find(c => c.course.code === code)

      const searchCode = mandatorycodesMapCourseCodeToCourseID.get(code)

      let foundSubsCourse
      if (searchCode) {
        foundSubsCourse = courses.find(c => {
          if (!c.course.substitutions) return false
          if (c.course.substitutions.length === null) return false
          return c.course.substitutions.includes(searchCode)
        })
      }

      let passedArray = foundCourse ? Object.keys(courses.find(c => c.course.code === code).students.passed) : null

      if (foundSubsCourse) {
        passedArray = passedArray
          ? [...passedArray, ...Object.keys(foundSubsCourse.students.passed)]
          : Object.keys(foundSubsCourse.students.passed)
      }
      obj[code] = passedArray
      return obj
    }, {})
  }

  return mandatoryPassed
}

const CoursesTable = ({ students }) => {
  const { getTextIn } = useLanguage()
  const namesVisible = useSelector(state => state?.settings?.namesVisible)
  const mandatoryCourses = useSelector(state => state?.populationMandatoryCourses?.data)
  const { data: populationCourses, pending } = useSelector(state => state?.populationSelectedStudentCourses)

  const mandatoryPassed = useMemo(
    () => getMandatoryPassed(mandatoryCourses, populationCourses),
    [mandatoryCourses, populationCourses]
  )

  const hasPassedMandatory = useCallback(
    (studentNumber, code) => mandatoryPassed[code] && mandatoryPassed[code].includes(studentNumber),
    [mandatoryPassed]
  )

  const totalMandatoryPassed = useCallback(
    studentNumber => _.sumBy(mandatoryCourses, ({ code }) => hasPassedMandatory(studentNumber, code)),
    [mandatoryCourses, hasPassedMandatory]
  )

  const columns = useMemo(() => {
    const nameColumns = [
      {
        key: 'studentnumber-parent',
        mergeHeader: true,
        // merge: true,
        title: 'Student Number',
        children: [
          {
            key: 'studentnumber',
            title: 'Student Number',
            cellProps: { title: 'student number' },
            getRowVal: s => (s.total ? '*' : s.studentNumber),
            getRowContent: s => (s.total ? 'Summary:' : s.studentNumber),
            child: true,
          },
          {
            key: 'icon',
            title: 'Icon',
            export: false,
            getRowVal: s =>
              !s.total && (
                <Item
                  as={Link}
                  to={`/students/${s.studentNumber}`}
                  onClick={() => {
                    sendAnalytics('Student details button clicked', 'Mandatory courses table')
                  }}
                >
                  <Icon name="user outline" />
                </Item>
              ),
            cellProps: { className: 'iconCell' },
            child: true,
          },
        ],
      },
      {
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
        cellProps: { title: 'total passed' },
        child: true,
      },
    ]

    if (namesVisible) {
      nameColumns.push(
        {
          key: 'lastname',
          title: 'last name',
          getRowVal: s => (s.total ? null : s.lastname),
          cellProps: { title: 'last name' },
          child: true,
        },
        {
          key: 'firstname',
          title: 'given names',
          getRowVal: s => (s.total ? null : s.firstnames),
          cellProps: { title: 'first names' },
          child: true,
        },
        {
          key: 'email',
          title: 'email',
          getRowVal: s => (s.total ? null : s.email),
          cellProps: { title: 'emails' },
          child: true,
        }
      )
    }

    const mandatoryCourseLabels = []

    const labelToMandatoryCourses = mandatoryCourses.reduce((acc, e) => {
      const label = e.label ? e.label.label : ''
      acc[label] = acc[label] || []
      if (acc[label].some(l => l.code === e.code)) return acc
      acc[label].push(e)
      if (e.label) mandatoryCourseLabels.push({ ...e.label, code: e.label_code })
      else mandatoryCourseLabels.push({ id: 'null', label: '', code: '' })
      return acc
    }, {})

    const sortedlabels = orderBy(
      uniqBy(mandatoryCourseLabels, l => l.label),
      [e => e.orderNumber],
      ['asc']
    )

    const { visibleLabels, visibleCourseCodes } = mandatoryCourses.reduce(
      (acc, cur) => {
        if (cur.visible && cur.visible.visibility) {
          acc.visibleLabels.add(cur.label_code)
          acc.visibleCourseCodes.add(cur.code)
        }

        return acc
      },
      { visibleLabels: new Set(), visibleCourseCodes: new Set() }
    )

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
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
              <div>{e.code}</div>
              <div style={{ color: 'gray', fontWeight: 'normal' }}>{e.id}</div>
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
                <div style={{ maxWidth: '15em', whiteSpace: 'normal', overflow: 'hidden', width: 'max-content' }}>
                  <div>{m.code}</div>
                  <div style={{ color: 'gray', fontWeight: 'normal' }}>{getTextIn(m.name)}</div>
                </div>
              ),
              textTitle: m.code,
              vertical: true,
              forceToolsMode: 'dangling',
              cellProps: {
                title: `${m.code}, ${getTextIn(m.name)}`,
                style: {
                  verticalAlign: 'middle',
                  textAlign: 'center',
                },
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
        mandatoryCourses.forEach(m => {
          if (passedCourses.has(m.code)) return
          passedCourses.add(m.code)
          if (hasPassedMandatory(s.studentNumber, m.code)) ++acc[m.code]
        })
        return acc
      },
      mandatoryCourses.reduce((acc, e) => ({ ...acc, [e.code]: 0 }), { total: true })
    )

    return [row(totals, { ignoreFilters: true }), ...students]
  }, [students, mandatoryCourses, hasPassedMandatory])

  return (
    <Tab.Pane loading={pending}>
      <div style={{ display: 'flex' }}>
        <div style={{ maxHeight: '80vh', width: '100%' }}>
          {mandatoryCourses.length > 0 && (
            <SortableTable
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
                textAlign: 'center',
              }}
              columns={columns}
              data={data}
            />
          )}
        </div>
      </div>
    </Tab.Pane>
  )
}

const Panes = ({
  filteredStudents,
  tags,
  visiblePanes,
  dataExport,
  variant,
  studentToTargetCourseDateMap,
  coursecode,
  studyGuidanceGroup,
  queryStudyrights,
  from,
  to,
}) => {
  const { handleTabChange } = useTabChangeAnalytics(
    ANALYTICS_CATEGORIES.populationStudents,
    'Change students table tab'
  )

  const panesAvailable = [
    {
      menuItem: 'General',
      render: () => (
        <Tab.Pane>
          <GeneralTab
            variant={variant}
            filteredStudents={filteredStudents}
            studentToTargetCourseDateMap={studentToTargetCourseDateMap}
            coursecode={coursecode}
            studyGuidanceGroup={studyGuidanceGroup}
            from={from}
            to={to}
          />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Courses',
      render: () => <CoursesTable students={filteredStudents} />,
    },
    {
      menuItem: 'Tags',
      render: () => (
        <Tab.Pane>
          <div style={{ overflowX: 'auto', maxHeight: '80vh' }}>
            {tags.length === 0 && (
              <div
                style={{
                  paddingLeft: '10px',
                  minHeight: '300px',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <h3>
                  No tags defined. You can define them{' '}
                  <Link
                    to={`/study-programme/${queryStudyrights[0]}?p_m_tab=0&p_tab=6`}
                    onClick={() => {
                      sendAnalytics('No tags defined button clicked', 'Tags tab')
                    }}
                  >
                    here
                  </Link>
                  .
                </h3>
              </div>
            )}
            {tags.length > 0 && (
              <>
                <TagPopulation
                  tags={tags}
                  selectedStudents={filteredStudents.map(stu => stu.studentNumber)}
                  studytrack={queryStudyrights[0]}
                />
                <TagList studytrack={queryStudyrights[0]} selectedStudents={filteredStudents} />
              </>
            )}
          </div>
        </Tab.Pane>
      ),
    },
  ]

  const panes = panesAvailable.filter(pane => visiblePanes.includes(pane.menuItem))

  return (
    <>
      <Grid columns="two">
        <Grid.Column>
          <StudentNameVisibilityToggle />
        </Grid.Column>
        {dataExport && (
          <Grid.Column textAlign="right">
            <Dropdown text="Export Data" icon="save" button labeled className="icon" direction="left">
              <Dropdown.Menu>{dataExport}</Dropdown.Menu>
            </Dropdown>
          </Grid.Column>
        )}
      </Grid>
      <Tab onTabChange={handleTabChange} panes={panes} data-cy="student-table-tabs" />
    </>
  )
}

const PopulationStudents = ({
  filteredStudents,
  studentToTargetCourseDateMap,
  dataExport,
  contentToInclude,
  coursecode = [],
  variant,
  studyGuidanceGroup,
  from,
  to,
}) => {
  const [state, setState] = useState({})
  const studentRef = useRef()
  const dispatch = useDispatch()
  const { studentlistVisible: showList } = useSelector(({ settings }) => settings)
  const { data: tags } = useSelector(({ tags }) => tags)
  const { query } = useSelector(({ populations }) => populations)
  const queryStudyrights = query ? Object.values(query.studyRights) : []
  const prevShowList = usePrevious(showList)
  const { isAdmin } = useGetAuthorizedUserQuery()
  const admin = isAdmin

  useEffect(() => {
    if (tags && tags.length > 0) return
    const queryStudyright = queryStudyrights[0]

    if (queryStudyright) {
      dispatch(getTagsByStudytrackAction(queryStudyright))
      dispatch(getStudentTagsByStudytrackAction(queryStudyright))
    }

    setState({ ...state, admin })
  }, [])

  useEffect(() => {
    if (!prevShowList && showList) {
      scrollToComponent(studentRef.current, { align: 'bottom' })
    }
  }, [prevShowList])

  if (filteredStudents.length === 0) return null

  return (
    <>
      <span style={{ marginRight: '0.5rem' }} ref={studentRef}>
        <InfoBox content={contentToInclude.infotoolTipContent} />
      </span>
      {admin ? <CheckStudentList students={filteredStudents.map(stu => stu.studentNumber)} /> : null}
      <Panes
        filteredStudents={filteredStudents}
        queryStudyrights={queryStudyrights}
        visiblePanes={contentToInclude.panesToInclude}
        dataExport={dataExport}
        variant={variant}
        studentToTargetCourseDateMap={studentToTargetCourseDateMap}
        tags={tags}
        studyGuidanceGroup={studyGuidanceGroup}
        coursecode={coursecode}
        from={from}
        to={to}
      />
    </>
  )
}

const PopulationStudentsContainer = ({ ...props }) => {
  const { variant } = props

  if (!['population', 'customPopulation', 'coursePopulation', 'studyGuidanceGroupPopulation'].includes(variant)) {
    throw new Error(`${variant} is not a proper variant!`)
  }

  const contentByVariant = {
    population: {
      panesToInclude: ['General', 'Courses', 'Tags'],
      infotoolTipContent: infotoolTips.PopulationStatistics.Students,
    },
    coursePopulation: {
      panesToInclude: ['General'],
      infotoolTipContent: infotoolTips.CoursePopulation.Students,
    },
    customPopulation: {
      panesToInclude: ['General'],
      infotoolTipContent: infotoolTips.PopulationStatistics.Students,
    },
    studyGuidanceGroupPopulation: {
      panesToInclude: ['General'],
      infotoolTipContent: infotoolTips.PopulationStatistics.Students,
    },
  }

  return <PopulationStudents contentToInclude={contentByVariant[variant]} {...props} />
}

export default PopulationStudentsContainer
