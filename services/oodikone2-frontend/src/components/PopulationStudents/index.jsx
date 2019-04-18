import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { string, arrayOf, object, func, bool, shape } from 'prop-types'
import { Header, Segment, Button, Icon, Popup } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import { getStudentTotalCredits, copyToClipboard, userRoles, reformatDate } from '../../common'
import { PRIORITYCODE_TEXTS } from '../../constants'

import { toggleStudentListVisibility } from '../../redux/settings'

import StudentNameVisibilityToggle from '../StudentNameVisibilityToggle'
import styles from '../PopulationCourseStats/populationCourseStats.css'
import SortableTable from '../SortableTable'
import InfoBox from '../InfoBox'
import infotooltips from '../../common/InfoToolTips'

const popupTimeoutLength = 1000

class PopulationStudents extends Component {
  state = {}

  async componentDidMount() {
    const roles = await userRoles()
    const admin = roles.includes('admin')

    this.setState({ admin })
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

    const { admin } = this.state
    const { queryStudyrights } = this.props

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

    const transferFrom = s => (s.previousRights[0] && s.previousRights[0].element_detail.name[this.props.language])

    const studyrightCodes = (studyrights, value) => (
      studyrights.filter((sr) => {
        const { studyrightElements } = sr
        return studyrightElements.filter(sre => (
          queryStudyrights.includes(sre.code)
        )).length >= queryStudyrights.length
      }).map(a => a[value])
    )

    const priorityText = (studyRights) => {
      const codes = studyrightCodes(studyRights, 'prioritycode')
      return codes.map(code => PRIORITYCODE_TEXTS[code] ? PRIORITYCODE_TEXTS[code] : code).join(', ') // eslint-disable-line
    }

    const extentCodes = (studyRights) => {
      const codes = studyrightCodes(studyRights, 'extentcode')
      return codes.join(', ') // eslint-disable-line
    }

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
        cellProps: { collapsing: true, className: styles.iconCell }
      },
      {
        key: 'credits since start',
        title: 'credits since start',
        getRowVal: getStudentTotalCredits
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
          cellProps: { collapsing: true, className: styles.iconCell }
        }
      )
    }

    return (
      <Fragment>
        <StudentNameVisibilityToggle />
        <SortableTable
          getRowKey={s => s.studentNumber}
          tableProps={{ celled: true }}
          columns={columns}
          data={this.props.selectedStudents.map(sn => students[sn])}
        />
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
          Students ({this.props.selectedStudents.length}) <InfoBox content={Students} />
        </Header>
        <Button onClick={() => this.props.toggleStudentListVisibility()}>
          {toggleLabel}
        </Button>
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
  queryStudyrights: arrayOf(string).isRequired

}

const mapStateToProps = ({ settings, populations }) => ({
  showNames: settings.namesVisible,
  showList: settings.studentlistVisible,
  language: settings.language,
  queryStudyrights: populations.query.studyRights
})

export default connect(
  mapStateToProps,
  { toggleStudentListVisibility }
)(withRouter(PopulationStudents))
