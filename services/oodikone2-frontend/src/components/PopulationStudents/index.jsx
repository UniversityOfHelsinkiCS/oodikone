import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { string, arrayOf, object, func, bool, shape } from 'prop-types'
import { Header, Segment, Button, Icon, Popup, Tab, Grid, Checkbox, List } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import { orderBy, uniqBy, flatten, sortBy } from 'lodash'
import XLSX from 'xlsx'
import { getStudentTotalCredits, copyToClipboard, userRoles, reformatDate, getTextIn, roundToTwo } from '../../common'
import { PRIORITYCODE_TEXTS } from '../../constants'

import { toggleStudentListVisibility } from '../../redux/settings'
import { getTagsByStudytrackAction } from '../../redux/tags'

import StudentNameVisibilityToggle from '../StudentNameVisibilityToggle'
import '../PopulationCourseStats/populationCourseStats.css'
import SortableTable from '../SortableTable'
import InfoBox from '../InfoBox'
import infotooltips from '../../common/InfoToolTips'
import CheckStudentList from '../CheckStudentList'
import TagStudent from '../TagStudent'
import TagPopulation from '../TagPopulation'

const popupTimeoutLength = 1000

class PopulationStudents extends Component {
  state = {
    containsStudyTracks: false,
    students: [],
    checked: false,
    checkedStudents: []
  }

  componentDidMount() {
    const roles = userRoles()
    const admin = roles.includes('admin')
    this.props.getTagsByStudytrack(this.props.queryStudyrights[0])
    this.setState({ admin, containsStudyTracks: this.containsStudyTracks() })

    const initialCheckedStudents = []
    this.props.selectedStudents.forEach((sn) => {
      const check = {
        studentnumber: sn,
        checked: false
      }
      initialCheckedStudents.push(check)
    })
    this.setState({ checkedStudents: initialCheckedStudents })
  }

  containsStudyTracks = () => {
    const { language } = this.props
    const students = this.props.samples.reduce((obj, s) => {
      obj[s.studentNumber] = s
      return obj
    }, {})
    this.setState({ students: this.props.samples })
    const allStudyrights = this.props.selectedStudents.map(sn => students[sn]).map(st => st.studyrights)
    return allStudyrights.map(studyrights => this.studyrightCodes(studyrights, 'studyrightElements')
      .reduce((acc, elemArr) => {
        elemArr.filter(el => el.element_detail.type === 30).forEach(el =>
          acc.push(getTextIn(el.element_detail.name, language)))
        return acc
      }, []).length > 0).some(el => el === true)
  }

  studyrightCodes = (studyrights, value) => {
    const { queryStudyrights } = this.props
    return studyrights.filter((sr) => {
      const { studyrightElements } = sr
      return studyrightElements.filter(sre => (
        queryStudyrights.includes(sre.code)
      )).length >= queryStudyrights.length
    }).map(a => a[value])
  }

  handlePopupOpen = (id) => {
    this.setState({ [id]: true })

    this.timeout = setTimeout(() => {
      this.setState({ [id]: false })
    }, popupTimeoutLength)
  }

  handlePopupClose = (id) => {
    this.setState({ [id]: false })
    clearTimeout(this.timeout)
  }

  handleAllCheck = () => {
    const newCheckedStudents = []
    this.props.selectedStudents.forEach((sn) => {
      const check = {
        studentnumber: sn,
        checked: !this.state.checked
      }
      newCheckedStudents.push(check)
    })
    this.setState({ checkedStudents: newCheckedStudents })
    this.setState({ checked: !this.state.checked })
  }

  handleSingleCheck = (studentnumber) => {
    const checker = this.state.checkedStudents.find(check => check.studentnumber === studentnumber)
    const idx = this.state.checkedStudents.indexOf(checker)
    const tempArr = [...this.state.checkedStudents]
    tempArr.splice(idx, 1, ({ studentnumber: checker.studentnumber, checked: !checker.checked }))
    this.setState({ checkedStudents: tempArr })
  }

  falsifyChecks = () => {
    const newCheckedStudents = []
    this.props.selectedStudents.forEach((sn) => {
      const check = {
        studentnumber: sn,
        checked: false
      }
      newCheckedStudents.push(check)
    })
    this.setState({ checkedStudents: newCheckedStudents })
    this.setState({ checked: false })
  }

  renderStudentTable() {
    if (!this.props.showList) {
      return null
    }

    const { admin, containsStudyTracks } = this.state
    const { history } = this.props
    const students = this.props.samples.reduce((obj, s) => {
      obj[s.studentNumber] = s
      return obj
    }, {})

    const pushToHistoryFn = studentNumber => this.props.history.push(`/students/${studentNumber}`)

    const copyToClipboardAll = () => {
      const studentsInfo = this.props.selectedStudents.map(number => students[number])
      const emails = studentsInfo.filter(s => s.email).map(s => s.email)
      const clipboardString = emails.join('; ')
      copyToClipboard(clipboardString)
    }

    const transferFrom = s => getTextIn(s.transferSource.name, this.props.language)

    const priorityText = (studyRights) => {
      const codes = this.studyrightCodes(studyRights, 'prioritycode')
      return codes.map(code => (PRIORITYCODE_TEXTS[code] ? PRIORITYCODE_TEXTS[code] : code)).join(', ')
    }

    const extentCodes = (studyRights) => {
      const codes = this.studyrightCodes(studyRights, 'extentcode')
      return codes.join(', ')
    }

    const studytrack = (studyrights) => {
      const { queryStudyrights } = this.props
      let startdate = '1900-01-01'
      const res = this.studyrightCodes(studyrights, 'studyrightElements')
        .reduce((acc, elemArr) => {
          elemArr.filter(el => el.element_detail.type === 20).forEach((el) => {
            if (queryStudyrights.includes(el.code)) {
              startdate = el.startdate // eslint-disable-line
            }
          })
          elemArr.filter(el => el.element_detail.type === 30).forEach((el) => {
            if (el.enddate > startdate) {
              acc.push({ name: el.element_detail.name.fi, startdate: el.startdate, enddate: el.enddate })
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
        getRowVal: s => s.studentNumber,
        headerProps: { colSpan: 2 }
      },
      {
        key: 'icon',
        getRowVal: s => (<Icon name="level up alternate" onClick={() => pushToHistoryFn(s.studentNumber)} />),
        cellProps: { collapsing: true, className: 'iconCell' }
      },
      {
        key: 'credits since start',
        title: 'credits since start',
        getRowVal: (s) => {
          const credits = getStudentTotalCredits(s)
          return roundToTwo(credits)
        }
      },
      {
        key: 'all credits',
        title: 'all credits',
        getRowVal: s => s.credits
      }
    )
    if (history.location.pathname !== '/coursepopulation') {
      columns.push({
        key: 'transferred from',
        title: 'transferred from',
        getRowVal: s => (s.transferredStudyright ? transferFrom(s) : '')
      })
    }
    if (containsStudyTracks && history.location.pathname !== '/coursepopulation') {
      columns.push({
        key: 'studytrack',
        title: 'studytrack',
        getRowVal: s => studytrack(s.studyrights).map(st => st.name)[0]
      })
    }

    if (admin && history.location.pathname !== '/coursepopulation') {
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
        },
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
                trigger={
                  <Icon
                    link
                    name="copy"
                    onClick={copyToClipboardAll}
                    style={{ float: 'right' }}
                  />}
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
          getRowVal: s => (
            s.email
              ? <Popup
                trigger={
                  <Icon
                    link
                    name="copy outline"
                    onClick={() => copyToClipboard(s.email)}
                    style={{ float: 'right' }}
                  />}
                content="Email copied!"
                on="click"
                open={this.state[s.studentNumber]}
                onClose={() => this.handlePopupClose(s.studentNumber)}
                onOpen={() => this.handlePopupOpen(s.studentNumber)}
                position="top right"
              />
              : null
          ),
          headerProps: { onClick: null, sorted: null },
          cellProps: { collapsing: true, className: 'iconCell' }
        }
      )
    }

    const verticalTitle = title => (
      // https://stackoverflow.com/a/41396815
      <div style={{ writingMode: 'vertical-rl', minWidth: '32px', textAlign: 'left' }}>
        {title}
      </div>
    )

    const hasPassedMandatory = (studentNumber, code) => (
      this.props.mandatoryPassed[code] && this.props.mandatoryPassed[code].includes(studentNumber)
    )

    const totalMandatoryPassed = studentNumber => (
      this.props.mandatoryCourses.reduce((acc, m) => (
        hasPassedMandatory(studentNumber, m.code) ?
          acc + 1 : acc
      ), 0)
    )

    const nameColumns = this.props.showNames ? [
      { key: 'lastname', title: 'last name', getRowVal: s => s.lastname, cellProps: { title: 'last name' }, child: true },
      { key: 'firstname', title: 'given names', getRowVal: s => s.firstnames, cellProps: { title: 'first names' }, child: true },
      { key: 'email', title: 'email', getRowVal: s => s.email, cellProps: { title: 'emails' }, child: true }
    ] : []
    nameColumns.push(
      {
        key: 'studentnumber',
        title: verticalTitle('student number'),
        cellProps: { title: 'student number' },
        getRowVal: s => s.studentNumber,
        child: true
      },
      {
        key: 'icon',
        title: '',
        getRowVal: s => (<Icon name="level up alternate" onClick={() => pushToHistoryFn(s.studentNumber)} />),
        cellProps: { collapsing: true, className: 'iconCell' },
        child: true
      },
      {
        key: 'totalpassed',
        title: verticalTitle('total passed'),
        getRowVal: s => totalMandatoryPassed(s.studentNumber),
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
    const sortedlabels = orderBy(
      uniqBy(mandatoryCourseLabels, l => l.label),
      [e => e.orderNumber],
      ['asc']
    )

    const labelColumns = []
    if (sortedlabels.filter(e => e.label !== '').length > 0) {
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
            <div style={{ overflowX: 'hidden' }}><div style={{ width: 0 }}>{e.label}</div></div>
          ),
          parent: true,
          headerProps: { colSpan: labelToMandatoryCourses[e.label].length, title: e.label, ordernumber: e.orderNumber }
        }))
      )
    }

    const mandatoryCourseColumns = [
      ...nameColumns,
      ...labelColumns,
      ...flatten(sortedlabels.map(e => sortBy(
        labelToMandatoryCourses[e.label],
        [(m) => {
          const res = m.code.match(/\d+/)
          return res ? Number(res[0]) : Number.MAX_VALUE
        }, 'code']
      ).map(m => ({
        key: m.code,
        title: verticalTitle(<Fragment>{getTextIn(m.name, this.props.language)}<br />{m.code}</Fragment>),
        cellProps: { title: `${getTextIn(m.name, this.props.language)}\n${m.code}` },
        getRowVal: s => hasPassedMandatory(s.studentNumber, m.code),
        getRowContent: s => (
          hasPassedMandatory(s.studentNumber, m.code) ? (<Icon fitted name="check" color="green" />) : (null)
        ),
        child: true,
        childOf: e.label
      }))))
    ]

    const tagRows = this.props.selectedStudents
      .map(sn => students[sn])
      .map((s) => {
        const check = this.state.checkedStudents.find(c => c.studentnumber === s.studentNumber) || false
        return (
          <div key={s.studentNumber}>
            <List horizontal>
              <List.Item>
                <Checkbox
                  checked={check.checked}
                  onChange={() => this.handleSingleCheck(s.studentNumber)}
                />
              </List.Item>
              <List.Item>
                <TagStudent
                  tags={this.props.tags}
                  studentnumber={s.studentNumber}
                  studentstags={s.tags}
                  studytrack={this.props.queryStudyrights[0]}
                />
              </List.Item>
            </List>
          </div>)
      })

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
                <SortableTable
                  getRowKey={s => s.studentNumber}
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
                  data={this.props.selectedStudents.map(sn => students[sn])}
                />
              </div>
              <div style={{ paddingLeft: '2em' }}>
                {this.props.mandatoryCourses.length === 0 &&
                  <h1>Please define mandatory courses at study program overview panel!</h1>}
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
              <TagPopulation
                allChecker={this.state.checked}
                handleAllCheck={() => this.handleAllCheck()}
                falsifyChecks={() => this.falsifyChecks()}
                tags={this.props.tags}
                checkedStudents={this.state.checkedStudents}
                studytrack={this.props.queryStudyrights[0]}
              />
              {tagRows}
            </div>
          </Tab.Pane>
        )
      }
    ]

    const generateWorkbook = () => {
      const data = this.props.selectedStudents.map(sn => students[sn])
      const sortedMandatory = sortBy(
        this.props.mandatoryCourses,
        [(m) => {
          const res = m.code.match(/\d+/)
          return res ? Number(res[0]) : Number.MAX_VALUE
        }]
      )
      const worksheet = XLSX.utils.json_to_sheet(data.map(s => ({
        'last name': s.lastname,
        'given names': s.firstnames,
        'student number': s.studentNumber,
        'credits since start': getStudentTotalCredits(s),
        'all credits': s.credits,
        email: s.email,
        'transferred from': (s.transferredStudyright ? transferFrom(s) : ''),
        priority: priorityText(s.studyrights),
        extent: extentCodes(s.studyrights),
        studytrack: studytrack(s.studyrights).map(st => st.name)[0],
        'updated at': reformatDate(s.updatedAt, 'YYYY-MM-DD  hh:mm:ss'),
        'mandatory total passed': totalMandatoryPassed(s.studentNumber),
        ...sortedMandatory.reduce((acc, m) => {
          acc[`${getTextIn(m.name, this.props.language)}\n${m.code}`] = hasPassedMandatory(s.studentNumber, m.code)
          return acc
        }, {})
      })))
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet)
      return workbook
    }
    const filteredPanes = (panesToFilter) => {
      if (history.location.pathname === '/coursepopulation') {
        return panesToFilter.slice(0, 1)
      }
      if (!this.state.admin) {
        return panesToFilter.slice(0, 2)
      }
      return panesToFilter
    }
    return (
      <Fragment>
        <Grid columns="two">
          <Grid.Column><StudentNameVisibilityToggle /></Grid.Column>
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
      <Segment>
        <Header dividing >
          {`Students (${this.props.selectedStudents.length}) `}
          <Button size="small" onClick={() => this.props.toggleStudentListVisibility()}>{toggleLabel}</Button>
          {this.state.admin ? (<CheckStudentList students={this.props.selectedStudents} />) : null}
          <InfoBox content={Students} />
        </Header>
        {this.renderStudentTable()}
      </Segment>
    )
  }
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
  mandatoryCourses: arrayOf(shape({
    name: shape({
      en: string.isRequired,
      fi: string.isRequired,
      sv: string.isRequired
    }).isRequired,
    code: string.isRequired
  })).isRequired,
  mandatoryPassed: shape({}).isRequired,
  tags: arrayOf(shape({ tag_id: string, tagname: string, studytrack: string })).isRequired,
  getTagsByStudytrack: func.isRequired
}

const mapStateToProps = ({ localize, settings, populations, populationCourses, populationMandatoryCourses, tags }) => {
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
    mandatoryCourses: populationMandatoryCourses.data,
    mandatoryPassed,
    tags: tags.data
  }
}

export default connect(
  mapStateToProps,
  { toggleStudentListVisibility, getTagsByStudytrack: getTagsByStudytrackAction }
)(withRouter(PopulationStudents))
