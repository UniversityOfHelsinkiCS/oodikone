import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { string, arrayOf, object, func, bool, shape } from 'prop-types'
import { Header, Segment, Button, Icon, Popup, Tab, Grid } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import _ from 'lodash'
import XLSX from 'xlsx'
import { getStudentTotalCredits, copyToClipboard, userRoles, reformatDate, getTextIn, roundToTwo } from '../../common'
import { PRIORITYCODE_TEXTS } from '../../constants'

import { toggleStudentListVisibility } from '../../redux/settings'

import StudentNameVisibilityToggle from '../StudentNameVisibilityToggle'
import '../PopulationCourseStats/populationCourseStats.css'
import SortableTable from '../SortableTable'
import InfoBox from '../InfoBox'
import infotooltips from '../../common/InfoToolTips'

const popupTimeoutLength = 1000


class PopulationStudents extends Component {
  state = { containsStudyTracks: false }

  async componentDidMount() {
    const roles = await userRoles()
    const admin = roles.includes('admin')

    this.setState({ admin, containsStudyTracks: this.containsStudyTracks() })
  }

  containsStudyTracks = () => {
    const students = this.props.samples.reduce((obj, s) => {
      obj[s.studentNumber] = s
      return obj
    }, {})
    const allStudyrights = this.props.selectedStudents.map(sn => students[sn]).map(st => st.studyrights)
    return allStudyrights.map(studyrights => this.studyrightCodes(studyrights, 'studyrightElements')
      .reduce((acc, elemArr) => {
        elemArr.filter(el => el.element_detail.type === 30).forEach(el =>
          acc.push(el.element_detail.name.fi))
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

  renderStudentTable() {
    if (!this.props.showList) {
      return null
    }

    const { admin, containsStudyTracks } = this.state

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

    const transferFrom = s => (s.previousRights[0] && getTextIn(s.previousRights[0].element_detail.name, this.props.language))

    const priorityText = (studyRights) => {
      const codes = this.studyrightCodes(studyRights, 'prioritycode')
      return codes.map(code => PRIORITYCODE_TEXTS[code] ? PRIORITYCODE_TEXTS[code] : code).join(', ') // eslint-disable-line
    }

    const extentCodes = (studyRights) => {
      const codes = this.studyrightCodes(studyRights, 'extentcode')
      return codes.join(', ') // eslint-disable-line
    }

    const studytrack = studyrights => (
      this.studyrightCodes(studyrights, 'studyrightElements')
        .reduce((acc, elemArr) => {
          elemArr.filter(el => el.element_detail.type === 30).forEach(el =>
            acc.push(el.element_detail.name.fi))
          return acc
        }, []))

    const columns = []
    if (this.props.showNames) {
      columns.push(
        { key: 'lastname', title: 'last name', getRowVal: s => s.lastname },
        { key: 'firstname', title: 'first names', getRowVal: s => s.firstnames }
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
      },
      {
        key: 'transferred from',
        title: 'transferred from',
        getRowVal: s => (s.transferredStudyright ? transferFrom(s) : '')
      }
    )

    if (containsStudyTracks) {
      columns.push({
        key: 'studytrack',
        title: 'studytrack',
        getRowVal: s => studytrack(s.studyrights)
      })
    }

    if (admin) {
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
        {
          key: 'updatedAt',
          title: 'last updated at',
          getRowVal: s => reformatDate(s.updatedAt, 'YYYY-MM-DD  hh:mm:ss')
        }
      )
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

    const mandatoryCourseColumns = [
      ...(this.props.showNames) ? [
        { key: 'lastname', title: 'last name', getRowVal: s => s.lastname, cellProps: { title: 'last name' } },
        { key: 'firstname', title: 'first names', getRowVal: s => s.firstnames, cellProps: { title: 'first names' } },
        { key: 'email', title: 'emails', getRowVal: s => s.email, cellProps: { title: 'emails' } }
      ] : [],
      {
        key: 'studentnumber',
        title: verticalTitle('student number'),
        cellProps: { title: 'student number' },
        getRowVal: s => s.studentNumber
      },
      {
        key: 'icon',
        title: '',
        getRowVal: s => (<Icon name="level up alternate" onClick={() => pushToHistoryFn(s.studentNumber)} />),
        cellProps: { collapsing: true, className: 'iconCell' }
      },
      {
        key: 'totalpassed',
        title: verticalTitle('total passed'),
        getRowVal: s => totalMandatoryPassed(s.studentNumber),
        cellProps: { title: 'total passed' }
      },
      ..._.sortBy(
        this.props.mandatoryCourses,
        [(m) => {
          const res = m.code.match(/\d+/)
          return res ? Number(res[0]) : Number.MAX_VALUE
        }]
      ).map(m => ({
        key: m.code,
        title: verticalTitle(<Fragment>{getTextIn(m.name, this.props.language)}<br />{m.code}</Fragment>),
        cellProps: { title: `${getTextIn(m.name, this.props.language)}\n${m.code}` },
        getRowVal: s => hasPassedMandatory(s.studentNumber, m.code),
        getRowContent: s => (
          hasPassedMandatory(s.studentNumber, m.code) ? (<Icon fitted name="check" color="green" />) : (null)
        )
      }))
    ]

    const panes = [
      {
        menuItem: 'General',
        render: () => (
          <Tab.Pane>
            <div style={{ overflowX: 'auto' }}>
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
              <div style={{ overflowX: 'auto' }}>
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
      }
    ]

    const generateWorkbook = () => {
      const data = this.props.selectedStudents.map(sn => students[sn])
      const sortedMandatory = _.sortBy(
        this.props.mandatoryCourses,
        [(m) => {
          const res = m.code.match(/\d+/)
          return res ? Number(res[0]) : Number.MAX_VALUE
        }]
      )
      const worksheet = XLSX.utils.json_to_sheet(data.map(s => ({
        'last name': s.firstnames,
        'first names': s.lastname,
        'student number': s.studentNumber,
        'credits since start': getStudentTotalCredits(s),
        'all credits': s.credits,
        email: s.email,
        'transferred from': (s.transferredStudyright ? transferFrom(s) : ''),
        priority: priorityText(s.studyrights),
        extent: extentCodes(s.studyrights),
        studytrack: studytrack(s.studyrights).join(', '),
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
        <Tab panes={panes} />
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
  mandatoryPassed: shape({}).isRequired
}

const mapStateToProps = ({ settings, populations, populationCourses, populationMandatoryCourses }) => {
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
    language: settings.language,
    queryStudyrights: Object.values(populations.query.studyRights),
    mandatoryCourses: populationMandatoryCourses.data,
    mandatoryPassed
  }
}

export default connect(
  mapStateToProps,
  { toggleStudentListVisibility }
)(withRouter(PopulationStudents))
