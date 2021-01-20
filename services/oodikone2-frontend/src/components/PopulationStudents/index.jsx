import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { string, arrayOf, object, func, bool, shape, node } from 'prop-types'
import { Icon, Tab, Grid, Ref, Item, Dropdown } from 'semantic-ui-react'
import { withRouter, Link } from 'react-router-dom'
import { orderBy, uniqBy, flatten, sortBy, isNumber } from 'lodash'
import scrollToComponent from 'react-scroll-to-component'
import { getTextIn, getUserRoles } from '../../common'
import { useTabChangeAnalytics } from '../../common/hooks'

import { toggleStudentListVisibility } from '../../redux/settings'
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
import info from '../../common/markdown/populationStatistics/students.info.md'
import infoForCoursePop from '../../common/markdown/coursePopulation/students.info.md'

// TODO: Refactoring in process, contains lot of duplicate code.

const sendAnalytics = sendEvent.populationStudents

const StudentTableTabs = ({ panes, filterPanes }) => {
  // only its own component really because I needed to use hooks and didn't want to refactor
  // this megamillion line component :) /Joona
  const { handleTabChange } = useTabChangeAnalytics(
    ANALYTICS_CATEGORIES.populationStudents,
    'Change students table tab'
  )

  return <Tab onTabChange={handleTabChange} panes={filterPanes(panes)} data-cy="student-table-tabs" />
}

StudentTableTabs.propTypes = {
  panes: arrayOf(object).isRequired,
  filterPanes: func.isRequired
}

class PopulationStudents extends Component {
  constructor(props) {
    super(props)

    this.state = {}

    this.studentsRef = React.createRef()
  }

  componentDidMount() {
    const queryStudyright = this.props.queryStudyrights[0]
    const admin = this.props.userRoles.includes('admin')
    if (queryStudyright) {
      this.props.getTagsByStudytrack(queryStudyright)
      this.props.getStudentTagsStudyTrack(queryStudyright)
    }
    this.setState({ admin })
  }

  componentDidUpdate = prevProps => {
    if (!prevProps.showList && this.props.showList) {
      scrollToComponent(this.studentsRef.current, { align: 'bottom' })
    }
  }

  studyrightCodes = (studyrights, value) => {
    const { queryStudyrights } = this.props
    return studyrights
      .filter(sr => {
        const { studyright_elements: studyrightElements } = sr
        return studyrightElements.filter(sre => queryStudyrights.includes(sre.code)).length >= queryStudyrights.length
      })
      .map(a => a[value])
  }

  handleRef = node => {
    this.studentsRef.current = node
  }

  renderStudentTable() {
    const { customPopulation, coursePopulation } = this.props
    const verticalTitle = title => <div className="verticalTitle">{title}</div>

    const hasPassedMandatory = (studentNumber, code) =>
      this.props.mandatoryPassed[code] && this.props.mandatoryPassed[code].includes(studentNumber)

    const totalMandatoryPassed = studentNumber =>
      this.props.mandatoryCourses.reduce((acc, m) => (hasPassedMandatory(studentNumber, m.code) ? acc + 1 : acc), 0)

    const nameColumns = this.props.showNames
      ? [
          {
            key: 'lastname',
            title: 'last name',
            getRowVal: s => (s.total ? null : s.lastname),
            cellProps: { title: 'last name' },
            child: true
          },
          {
            key: 'firstname',
            title: 'given names',
            getRowVal: s => (s.total ? null : s.firstnames),
            cellProps: { title: 'first names' },
            child: true
          },
          {
            key: 'email',
            title: 'email',
            getRowVal: s => (s.total ? null : s.email),
            cellProps: { title: 'emails' },
            child: true
          }
        ]
      : []
    nameColumns.push(
      {
        key: 'studentnumber',
        title: verticalTitle('student number'),
        cellProps: { title: 'student number' },
        getRowVal: s => (s.total ? '*' : s.studentNumber),
        getRowContent: s => (s.total ? 'Summary:' : s.studentNumber),
        child: true
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
        child: true
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
        child: true
      }
    )

    const mandatoryCourseLabels = []

    const labelToMandatoryCourses = this.props.mandatoryCourses.reduce((acc, e) => {
      const label = e.label ? e.label.label : ''
      acc[label] = acc[label] || []
      acc[label].push(e)
      if (e.label) mandatoryCourseLabels.push({ ...e.label, code: e.label_code })
      else mandatoryCourseLabels.push({ id: 'null', label: '', code: '' })
      return acc
    }, {})

    const sortedlabels = orderBy(uniqBy(mandatoryCourseLabels, l => l.label), [e => e.orderNumber], ['asc'])

    const mandatoryTitle = m => {
      return (
        <Fragment>
          {getTextIn(m.name, this.props.language)}
          <br />
          {m.code}
        </Fragment>
      )
    }

    const { visibleLabels, visibleCourseCodes } = this.props.mandatoryCourses.reduce(
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
        headerProps: { colSpan: nameColumns.length, style: { textAlign: 'right' } }
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
          headerProps: { colSpan: labelToMandatoryCourses[e.label].length, title: e.label, ordernumber: e.orderNumber }
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
            'code'
          ])
            .filter(course => visibleCourseCodes.has(course.code))
            .map(m => ({
              key: `${m.label ? m.label.label : 'fix'}-${m.code}`, // really quick and dirty fix
              title: verticalTitle(mandatoryTitle(m)),
              cellProps: { title: `${m.code}, ${getTextIn(m.name, this.props.language)}` },
              headerProps: { title: `${m.code}, ${getTextIn(m.name, this.props.language)}` },
              getRowVal: s => (s.total ? getTotalRowVal(s, m) : hasPassedMandatory(s.studentNumber, m.code)),
              getRowContent: s => {
                if (s.total) return getTotalRowVal(s, m)
                return hasPassedMandatory(s.studentNumber, m.code) ? <Icon fitted name="check" color="green" /> : null
              },
              child: true,
              childOf: e.label,
              code: m.code
            }))
        )
      )
    ]

    const totals = this.props.filteredStudents.reduce((acc, s) => {
      this.props.mandatoryCourses.forEach(m => {
        if (hasPassedMandatory(s.studentNumber, m.code)) ++acc[m.code]
      })
      return acc
    }, this.props.mandatoryCourses.reduce((acc, e) => ({ ...acc, [e.code]: 0 }), { total: true }))
    const mandatoryCourseData = [totals, ...this.props.filteredStudents]

    // FIXME: here only for refactorment
    const { showNames, studentToTargetCourseDateMap } = this.props
    const panes = [
      {
        menuItem: 'General',
        render: () => (
          <Tab.Pane>
            <GeneralTab
              showNames={showNames}
              coursePopulation={coursePopulation}
              customPopulation={customPopulation}
              studentToTargetCourseDateMap={studentToTargetCourseDateMap}
            />
          </Tab.Pane>
        )
      },
      {
        menuItem: 'Courses',
        render: () => (
          <Tab.Pane>
            <div style={{ display: 'flex' }}>
              <div style={{ overflowX: 'auto', maxHeight: '80vh' }}>
                {this.props.mandatoryCourses.length > 0 && (
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
                      textAlign: 'center'
                    }}
                    collapsingHeaders
                    showNames={this.props.showNames}
                    columns={mandatoryCourseColumns}
                    data={mandatoryCourseData}
                  />
                )}
              </div>
            </div>
          </Tab.Pane>
        )
      },
      {
        menuItem: 'Tags',
        render: () => (
          <Tab.Pane>
            <div style={{ overflowX: 'auto', maxHeight: '80vh' }}>
              {this.props.tags.length === 0 && (
                <div
                  style={{
                    paddingLeft: '10px',
                    minHeight: '300px',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <h3>
                    No tags defined. You can define them{' '}
                    <Link
                      to={`/study-programme/${this.props.queryStudyrights[0]}?p_m_tab=0&p_tab=6`}
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
              {this.props.tags.length > 0 && (
                <React.Fragment>
                  <TagPopulation
                    tags={this.props.tags}
                    selectedStudents={this.props.filteredStudents.map(stu => stu.studentNumber)}
                    studytrack={this.props.queryStudyrights[0]}
                  />
                  <TagList studytrack={this.props.queryStudyrights[0]} selectedStudents={this.props.filteredStudents} />
                </React.Fragment>
              )}
            </div>
          </Tab.Pane>
        )
      }
    ]

    const filteredPanes = panesToFilter => {
      if (coursePopulation || customPopulation) {
        return panesToFilter.slice(0, 1)
      }
      return panesToFilter
    }

    return (
      <Fragment>
        <Grid columns="two">
          <Grid.Column>
            <StudentNameVisibilityToggle />
          </Grid.Column>
          {this.props.dataExport && (
            <Grid.Column textAlign="right">
              <Dropdown text="Export Data" icon="save" button labeled className="icon" direction="left">
                <Dropdown.Menu>{this.props.dataExport}</Dropdown.Menu>
              </Dropdown>
            </Grid.Column>
          )}
        </Grid>
        <StudentTableTabs panes={panes} filterPanes={filteredPanes} />
      </Fragment>
    )
  }

  render() {
    if (this.props.filteredStudents.length === 0) {
      return null
    }

    return (
      <Ref innerRef={this.handleRef}>
        <>
          <span style={{ marginRight: '0.5rem' }}>
            <InfoBox content={this.props.coursePopulation ? infoForCoursePop : info} />
          </span>
          {this.state.admin ? (
            <CheckStudentList students={this.props.filteredStudents.map(stu => stu.studentNumber)} />
          ) : null}
          {this.renderStudentTable()}
        </>
      </Ref>
    )
  }
}

PopulationStudents.defaultProps = {
  studentToTargetCourseDateMap: null,
  customPopulation: false,
  coursePopulation: false,
  dataExport: null
}

PopulationStudents.propTypes = {
  showNames: bool.isRequired,
  showList: bool.isRequired,
  language: string.isRequired,
  queryStudyrights: arrayOf(string).isRequired,
  mandatoryCourses: arrayOf(
    shape({
      name: shape({}).isRequired,
      code: string.isRequired
    })
  ).isRequired,
  mandatoryPassed: shape({}).isRequired,
  tags: arrayOf(shape({ tag_id: string, tagname: string, studytrack: string })).isRequired,
  getTagsByStudytrack: func.isRequired,
  getStudentTagsStudyTrack: func.isRequired,
  userRoles: arrayOf(string).isRequired,
  studentToTargetCourseDateMap: shape({}),
  coursePopulation: bool,
  customPopulation: bool,
  filteredStudents: arrayOf(shape({})).isRequired,
  dataExport: node
}

const mapStateToProps = state => {
  const {
    settings,
    populations,
    populationCourses,
    populationMandatoryCourses,
    tags,
    auth: {
      token: { roles }
    }
  } = state

  const mandatoryCodes = populationMandatoryCourses.data
    .filter(course => course.visible && course.visible.visibility)
    .map(c => c.code)

  let mandatoryPassed = {}

  if (populationCourses.data.coursestatistics) {
    const courses = populationCourses.data.coursestatistics
    mandatoryPassed = mandatoryCodes.reduce((obj, code) => {
      const foundCourse = !!courses.find(c => c.course.code === code)
      obj[code] = foundCourse ? Object.keys(courses.find(c => c.course.code === code).students.passed) : null
      return obj
    }, {})
  }

  return {
    showNames: settings.namesVisible,
    showList: settings.studentlistVisible,
    queryStudyrights: populations.query ? Object.values(populations.query.studyRights) : [],
    mandatoryCourses: populationMandatoryCourses.data,
    mandatoryPassed,
    tags: tags.data,
    userRoles: getUserRoles(roles)
  }
}

export default connect(
  mapStateToProps,
  {
    toggleStudentListVisibility,
    getTagsByStudytrack: getTagsByStudytrackAction,
    getStudentTagsStudyTrack: getStudentTagsByStudytrackAction
  }
)(withRouter(PopulationStudents))
