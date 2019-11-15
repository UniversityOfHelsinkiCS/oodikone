import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { string, arrayOf, object, func, bool, shape } from 'prop-types'
import { Header, Segment, Button, Icon, Popup, Tab, Grid, Ref, Item } from 'semantic-ui-react'
import { withRouter, Link } from 'react-router-dom'
import { orderBy, uniqBy, flatten, sortBy, isNumber } from 'lodash'
import XLSX from 'xlsx'
import scrollToComponent from 'react-scroll-to-component'
import {
  getStudentTotalCredits,
  copyToClipboard,
  reformatDate,
  getTextIn,
  getUserRoles,
  getNewestProgramme
} from '../../common'
import { PRIORITYCODE_TEXTS } from '../../constants'

import { toggleStudentListVisibility } from '../../redux/settings'
import { getTagsByStudytrackAction } from '../../redux/tags'
import { getStudentTagsByStudytrackAction } from '../../redux/tagstudent'

import StudentNameVisibilityToggle from '../StudentNameVisibilityToggle'
import '../PopulationCourseStats/populationCourseStats.css'
import SortableTable from '../SortableTable'
import InfoBox from '../InfoBox'
import infotooltips from '../../common/InfoToolTips'
import CheckStudentList from '../CheckStudentList'
import TagPopulation from '../TagPopulation'
import TagList from '../TagList'
import selector from '../../selectors/populationDetails'
import './populationStudents.css'

const popupTimeoutLength = 1000

class PopulationStudents extends Component {
  constructor(props) {
    super(props)

    this.state = {
      containsStudyTracks: false,
      students: []
    }

    this.studentsRef = React.createRef()
  }

  componentDidMount() {
    const queryStudyright = this.props.queryStudyrights[0]
    const admin = this.props.userRoles.includes('admin')
    if (queryStudyright) {
      this.props.getTagsByStudytrack(queryStudyright)
      this.props.getStudentTagsStudyTrack(queryStudyright)
    }
    this.setState({ admin, containsStudyTracks: this.containsStudyTracks() })
  }

  componentDidUpdate = prevProps => {
    if (!prevProps.showList && this.props.showList) {
      scrollToComponent(this.studentsRef.current, { align: 'bottom' })
    }
  }

  containsStudyTracks = () => {
    const { language, populationStatistics } = this.props
    const students = this.props.samples.reduce((obj, s) => {
      obj[s.studentNumber] = s
      return obj
    }, {})
    this.setState({ students: this.props.samples })
    const allStudyrights = this.props.selectedStudents.map(sn => students[sn]).map(st => st.studyrights)
    return allStudyrights
      .map(
        studyrights =>
          this.studyrightCodes(studyrights, 'studyright_elements').reduce((acc, elemArr) => {
            elemArr
              .filter(el => populationStatistics.elementdetails.data[el.code].type === 30)
              .forEach(el => acc.push(getTextIn(populationStatistics.elementdetails.data[el.code].name, language)))
            return acc
          }, []).length > 0
      )
      .some(el => el === true)
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

  handlePopupOpen = id => {
    this.setState({ [id]: true })

    this.timeout = setTimeout(() => {
      this.setState({ [id]: false })
    }, popupTimeoutLength)
  }

  handlePopupClose = id => {
    this.setState({ [id]: false })
    clearTimeout(this.timeout)
  }

  handleRef = node => {
    this.studentsRef.current = node
  }

  renderStudentTable() {
    if (!this.props.showList) {
      return null
    }

    const { admin, containsStudyTracks } = this.state
    const { history, populationStatistics } = this.props
    const students = this.props.samples.reduce((obj, s) => {
      obj[s.studentNumber] = s
      return obj
    }, {})

    const studentToStudyrightStartMap = !['/coursepopulation', '/custompopulation'].includes(history.location.pathname)
      ? this.props.selectedStudents.reduce((res, sn) => {
          const targetStudyright = flatten(
            students[sn].studyrights.reduce((acc, curr) => {
              acc.push(curr.studyright_elements)
              return acc
            }, [])
          ).filter(e => e.code === this.props.queryStudyrights[0])
          res[sn] = targetStudyright[0] ? targetStudyright[0].startdate : null
          return res
        }, {})
      : null

    const pushToHistoryFn = studentNumber => this.props.history.push(`/students/${studentNumber}`)

    const copyToClipboardAll = () => {
      const studentsInfo = this.props.selectedStudents.map(number => students[number])
      const emails = studentsInfo.filter(s => s.email && !s.obfuscated).map(s => s.email)
      const clipboardString = emails.join('; ')
      copyToClipboard(clipboardString)
    }

    const transferFrom = s =>
      getTextIn(populationStatistics.elementdetails.data[s.transferSource].name, this.props.language)

    const priorityText = studyRights => {
      const codes = this.studyrightCodes(studyRights, 'prioritycode')
      return codes.map(code => (PRIORITYCODE_TEXTS[code] ? PRIORITYCODE_TEXTS[code] : code)).join(', ')
    }

    const extentCodes = studyRights => {
      const codes = this.studyrightCodes(studyRights, 'extentcode')
      return codes.join(', ')
    }

    const tags = tags => {
      const studentTags = tags.map(t => t.tag.tagname)
      return studentTags.join(', ')
    }

    const mainProgramme = (studyrights, studentNumber) => {
      const programme = getNewestProgramme(
        studyrights,
        studentNumber,
        this.props.studentToTargetCourseDateMap,
        populationStatistics.elementdetails.data
      )
      if (programme) {
        return programme.name
      }
      return null
    }

    const studytrack = studyrights => {
      const { queryStudyrights } = this.props
      let startdate = '1900-01-01'
      const res = this.studyrightCodes(studyrights, 'studyright_elements').reduce((acc, elemArr) => {
        elemArr
          .filter(el => populationStatistics.elementdetails.data[el.code].type === 20)
          .forEach(el => {
            if (queryStudyrights.includes(el.code)) {
              startdate = el.startdate // eslint-disable-line
            }
          })
        elemArr
          .filter(el => populationStatistics.elementdetails.data[el.code].type === 30)
          .forEach(el => {
            if (el.enddate > startdate) {
              acc.push({
                name: populationStatistics.elementdetails.data[el.code].name.fi,
                startdate: el.startdate,
                enddate: el.enddate
              })
            }
          })
        acc.sort((a, b) => new Date(b.startdate) - new Date(a.startdate))
        return acc
      }, [])
      return res
    }

    const columns = []
    if (this.props.showNames) {
      columns.push(
        { key: 'lastname', title: 'last name', getRowVal: s => s.lastname },
        { key: 'firstname', title: 'given names', getRowVal: s => s.firstnames }
      )
    }
    columns.push(
      {
        key: 'studentnumber',
        title: 'student number',
        getRowVal: s => (
          <span style={s.obfuscated ? { fontStyle: 'italic', color: 'graytext' } : {}}>
            {!s.obfuscated ? s.studentNumber : 'hidden'}
          </span>
        ),
        headerProps: { colSpan: 2 }
      },
      {
        key: 'icon',
        getRowVal: s =>
          !s.obfuscated ? (
            <Item as={Link} to={`students/${s.studentNumber}`}>
              <Icon name="level up alternate" />
            </Item>
          ) : null,
        cellProps: { collapsing: true, className: 'iconCellNoPointer' }
      }
    )
    if (!['/coursepopulation', '/custompopulation'].includes(history.location.pathname)) {
      columns.push({
        key: 'credits since start',
        title: 'credits since start of studyright',
        getRowVal: s => {
          const credits = getStudentTotalCredits(s)
          return credits
        }
      })
    }
    columns.push({
      key: 'all credits',
      title: 'all credits',
      getRowVal: s => s.credits
    })

    if (!['/coursepopulation', '/custompopulation'].includes(history.location.pathname)) {
      columns.push({
        key: 'transferred from',
        title: 'transferred from',
        getRowVal: s => (s.transferredStudyright ? transferFrom(s) : '')
      })
    }
    if (containsStudyTracks && !['/coursepopulation', '/custompopulation'].includes(history.location.pathname)) {
      columns.push({
        key: 'studytrack',
        title: 'studytrack',
        getRowVal: s => studytrack(s.studyrights).map(st => st.name)[0]
      })
    }

    if (admin && !['/coursepopulation', '/custompopulation'].includes(history.location.pathname)) {
      columns.push(
        {
          key: 'priority',
          title: 'priority',
          getRowVal: s => priorityText(s.studyrights)
        },
        {
          key: 'extent',
          title: 'extent',
          getRowVal: s => extentCodes(s.studyrights)
        }
      )
    }
    columns.push({
      key: 'tags',
      title: 'tags',
      getRowVal: s => (!s.obfuscated ? tags(s.tags) : '')
    })

    if (!['/coursepopulation', '/custompopulation'].includes(history.location.pathname)) {
      columns.push({
        key: 'studystartdate',
        title: 'start of studyright',
        getRowVal: s => new Date(studentToStudyrightStartMap[s.studentNumber]).getTime(),
        getRowContent: s => reformatDate(studentToStudyrightStartMap[s.studentNumber], 'YYYY-MM-DD')
      })
    }

    if (['/coursepopulation', '/custompopulation'].includes(history.location.pathname)) {
      columns.push(
        {
          key: 'programme',
          title: 'studyprogramme',
          getRowVal: s =>
            getTextIn(mainProgramme(s.studyrights, s.studentNumber), this.props.language) || 'No programme'
        },
        {
          key: 'startyear',
          title: 'start year at university',
          getRowVal: s => (!s.obfuscated ? reformatDate(s.started, 'YYYY') : '')
        }
      )
    }

    if (admin) {
      columns.push({
        key: 'updatedAt',
        title: 'last updated at',
        getRowVal: s => reformatDate(s.updatedAt, 'YYYY-MM-DD  hh:mm:ss')
      })
    }
    if (this.props.showNames) {
      columns.push(
        {
          key: 'email',
          title: (
            <Fragment>
              email
              <Popup
                trigger={<Icon link name="copy" onClick={copyToClipboardAll} style={{ float: 'right' }} />}
                content="Copied email list!"
                on="click"
                open={this.state['0']}
                onClose={() => this.handlePopupClose('0')}
                onOpen={() => this.handlePopupOpen('0')}
                position="top right"
              />
            </Fragment>
          ),
          getRowVal: s => s.email,
          headerProps: { colSpan: 2 }
        },
        {
          key: 'copy email',
          getRowVal: s =>
            s.email && !s.obfuscated ? (
              <Popup
                trigger={
                  <Icon link name="copy outline" onClick={() => copyToClipboard(s.email)} style={{ float: 'right' }} />
                }
                content="Email copied!"
                on="click"
                open={this.state[s.studentNumber]}
                onClose={() => this.handlePopupClose(s.studentNumber)}
                onOpen={() => this.handlePopupOpen(s.studentNumber)}
                position="top right"
              />
            ) : null,
          headerProps: { onClick: null, sorted: null },
          cellProps: { collapsing: true, className: 'iconCellNoPointer' }
        }
      )
    }

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
        getRowVal: s => !s.total && <Icon name="level up alternate" onClick={() => pushToHistoryFn(s.studentNumber)} />,
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
      if (e.label) mandatoryCourseLabels.push(e.label)
      else mandatoryCourseLabels.push({ id: 'null', label: '' })
      return acc
    }, {})

    const sortedlabels = orderBy(uniqBy(mandatoryCourseLabels, l => l.label), [e => e.orderNumber], ['asc'])

    const labelColumns = []
    labelColumns.push(
      {
        key: 'general',
        title: <b>Labels:</b>,
        parent: true,
        headerProps: { colSpan: nameColumns.length, style: { textAlign: 'right' } }
      },
      ...sortedlabels.map(e => ({
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
          ]).map(m => ({
            key: m.code,
            title: verticalTitle(
              <Fragment>
                {getTextIn(m.name, this.props.language)}
                <br />
                {m.code}
              </Fragment>
            ),
            cellProps: { title: `${getTextIn(m.name, this.props.language)}\n${m.code}` },
            headerProps: { title: `${getTextIn(m.name, this.props.language)}\n${m.code}` },
            getRowVal: s => (s.total ? getTotalRowVal(s, m) : hasPassedMandatory(s.studentNumber, m.code)),
            getRowContent: s => {
              if (s.total) return getTotalRowVal(s, m)
              return hasPassedMandatory(s.studentNumber, m.code) ? <Icon fitted name="check" color="green" /> : null
            },
            child: true,
            childOf: e.label
          }))
        )
      )
    ]

    const selectedStudentsData = this.props.selectedStudents.map(sn => students[sn])
    const totals = selectedStudentsData.reduce((acc, s) => {
      this.props.mandatoryCourses.forEach(m => {
        if (hasPassedMandatory(s.studentNumber, m.code)) ++acc[m.code]
      })
      return acc
    }, this.props.mandatoryCourses.reduce((acc, e) => ({ ...acc, [e.code]: 0 }), { total: true }))
    const mandatoryCourseData = [totals, ...selectedStudentsData]

    const panes = [
      {
        menuItem: 'General',
        render: () => (
          <Tab.Pane>
            <div style={{ overflowX: 'auto', maxHeight: '80vh' }}>
              <SortableTable
                getRowKey={s => s.studentNumber}
                tableProps={{
                  collapsing: true,
                  basic: true,
                  compact: 'very',
                  padded: false,
                  celled: true
                }}
                columns={columns}
                data={this.props.selectedStudents.map(sn => students[sn])}
              />
            </div>
          </Tab.Pane>
        )
      },
      {
        menuItem: 'Mandatory courses',
        render: () => (
          <Tab.Pane>
            <div style={{ display: 'flex' }}>
              <div style={{ overflowX: 'auto', maxHeight: '80vh' }}>
                {this.props.mandatoryCourses.length > 0 && (
                  <React.Fragment>
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
                  </React.Fragment>
                )}
              </div>
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
                {this.props.mandatoryCourses.length === 0 && (
                  <h3>
                    No mandatory courses defined. You can define them{' '}
                    <Link to={`/study-programme/${this.props.queryStudyrights[0]}?p_m_tab=0&p_tab=1`}>here</Link>.
                  </h3>
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
                {this.props.tags.length === 0 && (
                  <h3>
                    No tags defined. You can define them{' '}
                    <Link to={`/study-programme/${this.props.queryStudyrights[0]}?p_m_tab=0&p_tab=5`}>here</Link>.
                  </h3>
                )}
              </div>
              {this.props.tags.length > 0 && (
                <React.Fragment>
                  <TagPopulation
                    tags={this.props.tags}
                    selectedStudents={this.props.selectedStudents}
                    studytrack={this.props.queryStudyrights[0]}
                  />
                  <TagList
                    studytrack={this.props.queryStudyrights[0]}
                    selectedStudents={this.props.selectedStudents.map(sn => students[sn])}
                  />
                </React.Fragment>
              )}
            </div>
          </Tab.Pane>
        )
      }
    ]

    const generateWorkbook = () => {
      const data = this.props.selectedStudents.map(sn => students[sn])
      const sortedMandatory = sortBy(this.props.mandatoryCourses, [
        m => {
          const res = m.code.match(/\d+/)
          return res ? Number(res[0]) : Number.MAX_VALUE
        }
      ])
      const worksheet = XLSX.utils.json_to_sheet(
        data.map(s => ({
          'last name': s.lastname,
          'given names': s.firstnames,
          'student number': s.studentNumber,
          'credits since start': getStudentTotalCredits(s),
          'all credits': s.credits,
          email: s.email,
          'transferred from': s.transferredStudyright ? transferFrom(s) : '',
          priority: priorityText(s.studyrights),
          extent: extentCodes(s.studyrights),
          studytrack: studytrack(s.studyrights).map(st => st.name)[0],
          tags: tags(s.tags),
          'start year at university': reformatDate(s.started, 'YYYY'),
          'updated at': reformatDate(s.updatedAt, 'YYYY-MM-DD  hh:mm:ss'),
          'mandatory total passed': totalMandatoryPassed(s.studentNumber),
          ...sortedMandatory.reduce((acc, m) => {
            acc[`${getTextIn(m.name, this.props.language)}\n${m.code}`] = hasPassedMandatory(s.studentNumber, m.code)
            return acc
          }, {})
        }))
      )
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet)
      return workbook
    }
    const filteredPanes = panesToFilter => {
      if (['/coursepopulation', '/custompopulation'].includes(history.location.pathname)) {
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
          <Grid.Column textAlign="right">
            <Button icon labelPosition="right" onClick={() => XLSX.writeFile(generateWorkbook(), 'students.xlsx')}>
              Download
              <Icon name="file excel" />
            </Button>
          </Grid.Column>
        </Grid>
        <Tab panes={filteredPanes(panes)} />
      </Fragment>
    )
  }

  render() {
    const { Students } = infotooltips.PopulationStatistics
    if (this.props.samples.length === 0) {
      return null
    }

    const toggleLabel = this.props.showList ? 'hide' : 'show'
    return (
      <Ref innerRef={this.handleRef}>
        <Segment>
          <Header dividing>
            {`Students (${this.props.selectedStudents.length}) `}
            <Button size="small" onClick={() => this.props.toggleStudentListVisibility()}>
              {toggleLabel}
            </Button>
            {this.state.admin ? <CheckStudentList students={this.props.selectedStudents} /> : null}
            <InfoBox content={Students} />
          </Header>
          {this.renderStudentTable()}
        </Segment>
      </Ref>
    )
  }
}

PopulationStudents.defaultProps = {
  studentToTargetCourseDateMap: null
}

PopulationStudents.propTypes = {
  samples: arrayOf(object).isRequired,
  selectedStudents: arrayOf(string).isRequired,
  toggleStudentListVisibility: func.isRequired,
  showNames: bool.isRequired,
  showList: bool.isRequired,
  language: string.isRequired,
  history: shape({}).isRequired,
  queryStudyrights: arrayOf(string).isRequired,
  populationStatistics: shape({
    courses: arrayOf(shape({})),
    extents: arrayOf(shape({})),
    semesters: arrayOf(shape({})),
    students: arrayOf(shape({}))
  }).isRequired,
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
  studentToTargetCourseDateMap: shape({})
}

const mapStateToProps = state => {
  const {
    localize,
    settings,
    populations,
    populationCourses,
    populationMandatoryCourses,
    tags,
    tagstudent,
    auth: {
      token: { roles }
    }
  } = state

  const { selectedStudents, samples } = selector.makePopulationsToData(state)
  const mandatoryCodes = populationMandatoryCourses.data.map(c => c.code)

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
    language: getActiveLanguage(localize).code,
    queryStudyrights: populations.query ? Object.values(populations.query.studyRights) : [],
    populationStatistics: populations.data,
    mandatoryCourses: populationMandatoryCourses.data,
    mandatoryPassed,
    tags: tags.data,
    userRoles: getUserRoles(roles),
    tagstudent: tagstudent.data,
    selectedStudents,
    samples
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
