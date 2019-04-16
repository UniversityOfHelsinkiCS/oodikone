import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { shape, func, arrayOf, bool } from 'prop-types'
import { Form, Segment, Dropdown, Button, Message } from 'semantic-ui-react'
import { getProviders } from '../../redux/providers'
import { getSemesters } from '../../redux/semesters'
import { getTeacherStatistics } from '../../redux/teacherStatistics'
import TeacherStatisticsTable from '../TeacherStatisticsTable'
import { userRights } from '../../common'

const initial = {
  semesterStart: null,
  semesterEnd: null,
  providers: [],
  display: false,
  userProviders: []
}

class TeacherStatistics extends Component {
    state=initial

    async componentDidMount() {
      const rights = await userRights()
      const userProviders = this.mapToProviders(rights)
      this.setState({ userProviders })
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
      const { semesters, providers, statistics, pending } = this.props
      const { display, semesterStart, semesterEnd, userProviders } = this.state
      const invalidQueryParams = this.state.providers.length === 0 || !semesterStart
      const providerOptions = providers.filter(p => userProviders.includes(p.value))
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
                  options={semesters}
                  value={semesterStart}
                  onChange={this.setStartSemester}
                />
                <Form.Dropdown
                  name="semesterEnd"
                  placeholder="Semester"
                  label="End semester"
                  selection
                  search
                  options={semesters.filter(semester => semester.value > semesterStart)}
                  disabled={!semesterStart}
                  value={semesterEnd}
                  onChange={this.handleChange}
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
                />
              </Form.Field>
              <Button fluid content="Search" onClick={this.handleSubmit} disabled={invalidQueryParams} />
            </Form>
          </Segment>
          { display && !pending && (
            <Segment>
              <TeacherStatisticsTable
                statistics={statistics}
                onClickFn={e =>
                  this.props.history.push(`/teachers/${e.target.innerText}`)
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
  history: shape({}).isRequired
}

const mapStateToProps = (state) => {
  const { providers, teacherStatistics } = state
  const { semesters } = state.semesters.data
  const providerOptions = providers.data.map(p => ({
    key: p.providercode,
    value: p.providercode,
    text: p.name.fi || p.name.en
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
    failed: teacher.stats.failed
  }))
  return {
    providers: providerOptions,
    semesters: semesterOptions,
    statistics,
    pending: teacherStatistics.pending,
    error: teacherStatistics.error
  }
}

export default connect(mapStateToProps, {
  getProviders,
  getSemesters,
  getTeacherStatistics
})(withRouter(TeacherStatistics))
