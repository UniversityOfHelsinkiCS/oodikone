import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Icon, Tab, Grid, Item, Dropdown } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import { orderBy, uniqBy, flatten, sortBy, isNumber } from 'lodash'
import scrollToComponent from 'react-scroll-to-component'
import { getTextIn } from '../../common'
import { useTabChangeAnalytics, usePrevious, useIsAdmin } from '../../common/hooks'

import { getTagsByStudytrackAction } from '../../redux/tags'
import { getStudentTagsByStudytrackAction } from '../../redux/tagstudent'

import StudentNameVisibilityToggle from '../StudentNameVisibilityToggle'
import '../PopulationCourseStats/populationCourseStats.css'
import SortableTable from '../SortableTable'
import InfoBox from '../InfoBox'
import CheckStudentList from './CheckStudentList'
import TagPopulation from '../TagPopulation'
import TagList from '../TagList'
import './populationStudents.css'
import GeneralTab from './StudentTable/GeneralTab'
import sendEvent, { ANALYTICS_CATEGORIES } from '../../common/sendEvent'
import infotoolTips from '../../common/InfoToolTips'

const sendAnalytics = sendEvent.populationStudents

const PopulationStudents = ({
  language,
  filteredStudents,
  studentToTargetCourseDateMap,
  dataExport,
  contentToInclude,
  coursecode = [],
  variant,
  studyGuidanceGroup,
}) => {
  const [state, setState] = useState({})
  const studentRef = useRef()
  const dispatch = useDispatch()
  const { namesVisible: showNames, studentlistVisible: showList } = useSelector(({ settings }) => settings)
  const { data: tags } = useSelector(({ tags }) => tags)
  const { query } = useSelector(({ populations }) => populations)
  const queryStudyrights = query ? Object.values(query.studyRights) : []
  const { data: mandatoryCourses } = useSelector(({ populationMandatoryCourses }) => populationMandatoryCourses)
  const { data: populationCourses } = useSelector(({ populationCourses }) => populationCourses)
  const prevShowList = usePrevious(showList)
  const admin = useIsAdmin()
  const { handleTabChange } = useTabChangeAnalytics(
    ANALYTICS_CATEGORIES.populationStudents,
    'Change students table tab'
  )

  useEffect(() => {
    if (tags && tags.length > 0) return
    const queryStudyright = queryStudyrights[0]
    dispatch(getTagsByStudytrackAction(queryStudyright))
    dispatch(getStudentTagsByStudytrackAction(queryStudyright))
    setState({ ...state, admin })
  }, [])

  useEffect(() => {
    if (!prevShowList && showList) {
      scrollToComponent(studentRef.current, { align: 'bottom' })
    }
  }, [prevShowList])

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

  const renderStudentTable = () => {
    const verticalTitle = title => <div className="verticalTitle">{title}</div>

    const hasPassedMandatory = (studentNumber, code) =>
      mandatoryPassed[code] && mandatoryPassed[code].includes(studentNumber)

    const totalMandatoryPassed = studentNumber => {
      mandatoryCourses.reduce((acc, m) => {
        return hasPassedMandatory(studentNumber, m.code) ? acc + 1 : acc
      }, 0)
    }

    const nameColumns = showNames
      ? [
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
          },
        ]
      : []
    nameColumns.push(
      {
        key: 'studentnumber',
        title: verticalTitle('student number'),
        cellProps: { title: 'student number' },
        getRowVal: s => (s.total ? '*' : s.studentNumber),
        getRowContent: s => (s.total ? 'Summary:' : s.studentNumber),
        child: true,
      },
      {
        key: 'icon',
        title: '',
        getRowVal: s =>
          !s.total && (
            <Item
              as={Link}
              to={`/students/${s.studentNumber}`}
              onClick={() => {
                sendAnalytics('Student details button clicked', 'Mandatory courses table')
              }}
            >
              <Icon name="level up alternate" />
            </Item>
          ),
        cellProps: { collapsing: true, className: 'iconCell' },
        child: true,
      },
      {
        key: 'totalpassed',
        title: verticalTitle('total passed'),
        getRowVal: s =>
          s.total
            ? Object.values(s)
                .filter(isNumber)
                .reduce((acc, e) => acc + e, 0)
            : totalMandatoryPassed(s.studentNumber),
        cellProps: { title: 'total passed' },
        child: true,
      }
    )

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

    const mandatoryTitle = m => {
      return (
        <>
          {getTextIn(m.name, language)}
          <br />
          {m.code}
        </>
      )
    }

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

    const labelColumns = []
    labelColumns.push(
      {
        key: 'general',
        title: <b>Labels:</b>,
        parent: true,
        headerProps: { colSpan: nameColumns.length, style: { textAlign: 'right' } },
      },
      ...sortedlabels
        .filter(({ code }) => visibleLabels.has(code))
        .map(e => ({
          key: e.id,
          title: (
            <div style={{ overflowX: 'hidden' }}>
              <div style={{ width: 0 }}>{e.label}</div>
            </div>
          ),
          parent: true,
          headerProps: {
            colSpan: labelToMandatoryCourses[e.label].length,
            title: e.label,
            ordernumber: e.orderNumber,
          },
        }))
    )

    const getTotalRowVal = (t, m) => t[m.code]

    const mandatoryCourseColumns = [
      ...nameColumns,
      ...labelColumns,
      ...flatten(
        sortedlabels.map(e =>
          sortBy(labelToMandatoryCourses[e.label], [
            m => {
              const res = m.code.match(/\d+/)
              return res ? Number(res[0]) : Number.MAX_VALUE
            },
            'code',
          ])
            .filter(course => visibleCourseCodes.has(course.code))
            .map(m => ({
              key: `${m.label ? m.label.label : 'fix'}-${m.code}`, // really quick and dirty fix
              title: verticalTitle(mandatoryTitle(m)),
              cellProps: { title: `${m.code}, ${getTextIn(m.name, language)}` },
              headerProps: { title: `${m.code}, ${getTextIn(m.name, language)}` },
              getRowVal: s => (s.total ? getTotalRowVal(s, m) : hasPassedMandatory(s.studentNumber, m.code)),
              getRowContent: s => {
                if (s.total) return getTotalRowVal(s, m)
                return hasPassedMandatory(s.studentNumber, m.code) ? <Icon fitted name="check" color="green" /> : null
              },
              child: true,
              childOf: e.label,
              code: m.code,
            }))
        )
      ),
    ]

    const totals = filteredStudents.reduce(
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
    const mandatoryCourseData = [totals, filteredStudents]

    const panesAvailable = [
      {
        menuItem: 'General',
        render: () => (
          <Tab.Pane>
            <GeneralTab
              variant={variant}
              studentToTargetCourseDateMap={studentToTargetCourseDateMap}
              coursecode={coursecode}
              studyGuidanceGroup={studyGuidanceGroup}
            />
          </Tab.Pane>
        ),
      },
      {
        menuItem: 'Courses',
        render: () => (
          <Tab.Pane>
            <div style={{ display: 'flex' }}>
              <div style={{ overflowX: 'auto', maxHeight: '80vh' }}>
                {mandatoryCourses.length > 0 && (
                  <SortableTable
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
                    collapsingHeaders
                    showNames={showNames}
                    columns={mandatoryCourseColumns}
                    data={mandatoryCourseData}
                  />
                )}
              </div>
            </div>
          </Tab.Pane>
        ),
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

    const panes = panesAvailable.filter(pane => contentToInclude.panesToInclude.includes(pane.menuItem))

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

  if (filteredStudents.length === 0) return null

  return (
    <>
      <span style={{ marginRight: '0.5rem' }} ref={studentRef}>
        <InfoBox content={contentToInclude.infotoolTipContent} />
      </span>
      {admin ? <CheckStudentList students={filteredStudents.map(stu => stu.studentNumber)} /> : null}
      {renderStudentTable()}
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
