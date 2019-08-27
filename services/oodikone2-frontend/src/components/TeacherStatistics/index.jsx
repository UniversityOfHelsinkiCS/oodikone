import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { shape, func, arrayOf, bool, string } from 'prop-types'
import { Form, Segment, Dropdown, Button, Message } from 'semantic-ui-react'
import moment from 'moment'
import { getProviders } from '../../redux/providers'
import { getSemesters } from '../../redux/semesters'
import { getTeacherStatistics } from '../../redux/teacherStatistics'
import TeacherStatisticsTable from '../TeacherStatisticsTable'
import { getTextIn, getUserIsAdmin } from '../../common'

const initial = {
  semesterStart: null,
  semesterEnd: null,
  providers: [],
  display: false
}

class TeacherStatistics extends Component {
    state=initial

    componentDidMount() {
      this.props.getProviders()
      this.props.getSemesters()
    }

    setStartSemester = (_, { value }) => {
      const { semesterEnd } = this.state
      this.setState({ semesterStart: value })
      if (semesterEnd <= value) {
        this.setState({
          semesterEnd: value + 1
        })
      }
    }

    /*
    Maps new studyright codes to providercodes. Just a wild guess on how the codes are structured....
    --------
    KH50_005
    500-K005
    --------
    KH57_001
    500-K001
    --------
    KH80_003
    800-K003
    --------
    etcetc...
    */
    mapToProviders = rights => rights.map((r) => {
      if (r.includes('_')) {
        let newPrefix = ''
        let newSuffix = ''
        const split = r.split('_')
        newPrefix = `${split[0][2]}00`
        newSuffix = `${split[0][0]}${split[1]}`
        const providercode = `${newPrefix}-${newSuffix}`
        return providercode
      }
      return r
    })

    handleChange = (_, { name, value }) => {
      this.setState({ [name]: value })
    }

    handleSubmit = async () => {
      const { semesterStart, semesterEnd, providers } = this.state
      await this.props.getTeacherStatistics(semesterStart, semesterEnd, providers)
      this.setState({ display: true })
    }

    render() {
      const { semesters, providers, statistics, pending, isAdmin } = this.props
      const { display, semesterStart, semesterEnd } = this.state
      const userProviders = this.mapToProviders(this.props.rights)
      const invalidQueryParams = this.state.providers.length === 0 || !semesterStart
      const providerOptions = isAdmin ? providers : providers.filter(p => userProviders.includes(p.value))
      const filteredOptions = semesters.filter((sem) => {
        const options = moment(new Date())
          .diff(new Date(`${new Date().getFullYear()}-8-1`), 'days') > 0 ?
          Number(sem.text.replace(/[^0-9]/g, '')) <= new Date().getFullYear() :
          Number(sem.text.replace(/[^0-9]/g, '')) < new Date().getFullYear()
        return options
      })
      return (
        <div>
          <Message
            header="Teacher statistics by course providers"
            content="Statistics for teachers that admitted credits during
              and between the given semesters for one of the given course providers."
          />
          <Segment>
            <Form loading={pending}>
              <Form.Group widths="equal">
                <Form.Dropdown
                  name="semesterStart"
                  placeholder="Semester"
                  label="Start semester"
                  selection
                  search
                  options={filteredOptions}
                  value={semesterStart}
                  onChange={this.setStartSemester}
                  selectOnBlur={false}
                  selectOnNavigation={false}
                />
                <Form.Dropdown
                  name="semesterEnd"
                  placeholder="Semester"
                  label="End semester"
                  selection
                  search
                  options={filteredOptions.filter(semester => semester.value > semesterStart)}
                  disabled={!semesterStart}
                  value={semesterEnd}
                  onChange={this.handleChange}
                  selectOnBlur={false}
                  selectOnNavigation={false}
                />
              </Form.Group>
              <Form.Field>
                <label>Course providers</label>
                <Dropdown
                  name="providers"
                  placeholder="Providers"
                  multiple
                  selection
                  search
                  options={providerOptions}
                  value={this.state.providers}
                  onChange={this.handleChange}
                  selectOnBlur={false}
                  selectOnNavigation={false}
                />
              </Form.Field>
              <Button fluid content="Search" onClick={this.handleSubmit} disabled={invalidQueryParams} />
            </Form>
          </Segment>
          { display && !pending && (
            <Segment>
              <TeacherStatisticsTable
                statistics={statistics}
                onClickFn={id =>
                  this.props.history.push(`/teachers/${id}`)
                }
              />
            </Segment>
          )}
        </div>
      )
    }
}

TeacherStatistics.propTypes = {
  providers: arrayOf(shape({})).isRequired,
  semesters: arrayOf(shape({})).isRequired,
  statistics: arrayOf(shape({})).isRequired,
  getSemesters: func.isRequired,
  getProviders: func.isRequired,
  getTeacherStatistics: func.isRequired,
  pending: bool.isRequired,
  history: shape({}).isRequired,
  rights: arrayOf(string).isRequired,
  isAdmin: bool.isRequired
}

const mapStateToProps = (state) => {
  const { providers, teacherStatistics, auth: { token: { rights, roles } } } = state
  const { semesters } = state.semesters.data
  const providerOptions = providers.data.map(p => ({
    key: p.providercode,
    value: p.providercode,
    text: getTextIn(p.name, getActiveLanguage(state.localize).code)
  }))
  const semesterOptions = !semesters
    ? []
    : Object.values(semesters).reverse().map(({ semestercode, name }, idx) => ({
      key: idx,
      value: semestercode,
      text: name.en
    }))
  const statistics = Object.values(teacherStatistics.data).map(teacher => ({
    id: teacher.id,
    name: teacher.name,
    credits: teacher.stats.credits,
    passed: teacher.stats.passed,
    failed: teacher.stats.failed,
    transferred: teacher.stats.transferred
  }))
  return {
    providers: providerOptions,
    semesters: semesterOptions,
    statistics,
    pending: teacherStatistics.pending,
    error: teacherStatistics.error,
    rights,
    isAdmin: getUserIsAdmin(roles)
  }
}

export default connect(mapStateToProps, {
  getProviders,
  getSemesters,
  getTeacherStatistics
})(withRouter(TeacherStatistics))
