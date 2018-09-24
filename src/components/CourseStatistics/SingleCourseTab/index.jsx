import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Table, Radio } from 'semantic-ui-react'
import { shape } from 'prop-types'
import SingleCourseStats from '../SingleCourseStats'

class SingleCourse extends Component {
  state={
    selected: undefined
  }

  getStats = () => {
    const { stats } = this.props
    const statistics = Object.values(stats)
    let { selected } = this.state
    if (!selected && statistics.length > 0) {
      selected = statistics[0].coursecode
    }
    return {
      selected,
      statistics,
      selectedStatistic: stats[selected]
    }
  }

  render() {
    const { selected, statistics, selectedStatistic } = this.getStats()
    return (
      <div>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell content="Name" />
              <Table.HeaderCell content="Code" />
              <Table.HeaderCell content="Select" />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {statistics.map(stat => (
              <Table.Row key={stat.coursecode}>
                <Table.Cell content={stat.name} />
                <Table.Cell content={stat.coursecode} />
                <Table.Cell>
                  <Radio
                    toggle
                    checked={stat.coursecode === selected}
                    onClick={() => this.setState({ selected: stat.coursecode })}
                  />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        { selected && <SingleCourseStats stats={selectedStatistic} /> }
      </div>
    )
  }
}

SingleCourse.propTypes = {
  stats: shape({}).isRequired
}

const mapStateToProps = (state) => {
  const { data } = state.courseStats
  return {
    stats: data
  }
}

export default connect(mapStateToProps)(SingleCourse)
