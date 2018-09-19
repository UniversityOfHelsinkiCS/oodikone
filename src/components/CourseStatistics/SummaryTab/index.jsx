import React, { Component } from 'react'
import { Table, Form } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { shape, arrayOf } from 'prop-types'
import selectors from '../../../selectors/courseStats'

const INITIAL = {
  programme: selectors.ALL.value
}

class SummaryTab extends Component {
    state={ ...INITIAL }

    summaryStatistics = () => {
      const { statistics: s, programmes } = this.props
      const { programme: code } = this.state
      const prog = programmes.find(p => p.key === code)
      const filterStudent = studentnumber => new Set(prog.students).has(studentnumber)
      return Object.entries(s).map((entry) => {
        const [coursecode, data] = entry
        const { statistics, name } = data
        const summary = {
          passed: 0,
          failed: 0
        }
        statistics.forEach((groupstat) => {
          const { passed, failed } = groupstat.attempts.classes
          summary.passed += passed.filter(filterStudent).length
          summary.failed += failed.filter(filterStudent).length
        })
        const passrate = (100 * summary.passed) / (summary.passed + summary.failed)
        summary.passrate = !passrate ? null : passrate.toFixed(2)
        return {
          coursecode,
          name,
          summary
        }
      })
    }

    handleChange = (e, { name, value }) => this.setState({ [name]: value })

    render() {
      const stats = this.summaryStatistics()
      const options = this.props.programmes.map(p => ({
        ...p,
        label: {
          content: p.size,
          icon: 'user',
          basic: true
        }
      }))
      return (
        <div>
          <Form>
            <Form.Dropdown
              options={options}
              selection
              fluid
              label="Study programme"
              name="programme"
              onChange={this.handleChange}
              value={this.state.programme}
            />
          </Form>
          <Table
            headerRow={['Course', 'Passed', 'Failed', 'Passrate']}
            tableData={stats}
            renderBodyRow={({ coursecode, name, summary }) => ({
              key: coursecode,
              cells: [name, summary.passed, summary.failed, !summary.passrate ? '' : `${summary.passrate} %`]
            })}
          />
        </div>
      )
    }
}

SummaryTab.propTypes = {
  statistics: shape({}).isRequired,
  programmes: arrayOf(shape({})).isRequired
}

const mapStateToProps = state => ({
  statistics: state.courseStats.data,
  programmes: selectors.getAllStudyProgrammes(state)
})

export default connect(mapStateToProps)(SummaryTab)
