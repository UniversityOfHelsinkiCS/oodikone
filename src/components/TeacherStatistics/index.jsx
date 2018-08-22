import React, { Component } from 'react'
import { connect } from 'react-redux'
import { shape, func, arrayOf, bool } from 'prop-types'
import { Form, Segment, Dropdown, Button, Message } from 'semantic-ui-react'
import { getProviders } from '../../redux/providers'
import { getSemesters } from '../../redux/semesters'
import { getTeacherStatistics } from '../../redux/teacherStatistics'
import TeacherStatisticsTable from '../TeacherStatisticsTable'

const initial = {
  year: null,
  providers: [],
  display: false
}

class TeacherStatistics extends Component {
    state=initial

    componentDidMount() {
      this.props.getProviders()
      this.props.getSemesters()
    }

    handleChange = (_, { name, value }) => {
      this.setState({ [name]: value })
    }

    handleSubmit = async () => {
      const { year, providers } = this.state
      await this.props.getTeacherStatistics(year, providers)
      this.setState({ display: true })
    }

    render() {
      const { years, providers, statistics, pending } = this.props
      const { display } = this.state
      const invalidQueryParams = this.state.providers.length === 0 || !this.state.year
      return (
        <div>
          <Segment>
            <Form loading={pending}>
              <Message content="Statistics for teachers that admitted credits during the given academic year for one of the given course providers." />
              <Form.Field>
                <label>Academic year</label>
                <Dropdown
                  name="year"
                  placeholder="Academic year"
                  selection
                  search
                  options={years}
                  value={this.state.year}
                  onChange={this.handleChange}
                />
              </Form.Field>
              <Form.Field>
                <label>Course providers</label>
                <Dropdown
                  name="providers"
                  placeholder="Providers"
                  multiple
                  selection
                  search
                  options={providers}
                  value={this.state.providers}
                  onChange={this.handleChange}
                />
              </Form.Field>
              <Button fluid content="Search" onClick={this.handleSubmit} disabled={invalidQueryParams} />
            </Form>
          </Segment>
          { display && !pending && (
            <Segment>
              <TeacherStatisticsTable statistics={statistics} />
            </Segment>
          )}
        </div>
      )
    }
}

TeacherStatistics.propTypes = {
  providers: arrayOf(shape({})).isRequired,
  years: arrayOf(shape({})).isRequired,
  statistics: arrayOf(shape({})).isRequired,
  getSemesters: func.isRequired,
  getProviders: func.isRequired,
  getTeacherStatistics: func.isRequired,
  pending: bool.isRequired
}

const mapStateToProps = (state) => {
  const { providers, semesters, teacherStatistics } = state
  const { years } = semesters.data
  const providerOptions = providers.data.map(p => ({
    key: p.providercode,
    value: p.providercode,
    text: p.name.fi || p.name.en
  }))
  const yearOptions = !years ? [] : Object.entries(years).reverse().map(([code, year], idx) => ({
    key: idx,
    value: code,
    text: year.yearname
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
    years: yearOptions,
    statistics,
    pending: teacherStatistics.pending,
    error: teacherStatistics.error
  }
}

export default connect(mapStateToProps, {
  getProviders,
  getSemesters,
  getTeacherStatistics
})(TeacherStatistics)
