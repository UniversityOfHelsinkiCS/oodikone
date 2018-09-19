import React, { Component } from 'react'
import { Tab, Table, Grid, Header } from 'semantic-ui-react'
import { shape, string, number, oneOfType, arrayOf } from 'prop-types'

const StatsTable = ({ stats, name }) => (
  <div>
    <Header as="h3" content={name} textAlign="center" />
    <Table
      headerRow={['Time', 'Passed', 'Failed']}
      tableData={stats}
      renderBodyRow={stat => ({
        key: stat.code,
        cells: [stat.name, stat.cumulative.categories.passed, stat.cumulative.categories.failed]
      })}
    />
  </div>
)

StatsTable.propTypes = {
  stats: arrayOf(shape({})).isRequired,
  name: oneOfType([number, string]).isRequired
}

class ResultTabs extends Component {
    state={}
    render() {
      const { primary, comparison } = this.props
      return (
        <Tab
          panes={[
                {
                    menuItem: 'Table',
                    render: () => (
                      <Grid padded="vertically" columns="equal">
                        <Grid.Row>
                          {primary && (
                            <Grid.Column>
                              <StatsTable name={primary.name} stats={primary.stats} />
                            </Grid.Column>
                          )}
                          {
                            comparison && (
                              <Grid.Column>
                                <StatsTable name={comparison.name} stats={comparison.stats} />
                              </Grid.Column>
                            )
                          }
                        </Grid.Row>
                      </Grid>
                    )
                }
            ]}
        />)
    }
}

ResultTabs.propTypes = {
  primary: shape({
    name: string,
    code: oneOfType([string, number]),
    stats: arrayOf(shape({}))
  }).isRequired,
  comparison: shape({
    name: string,
    code: oneOfType([string, number]),
    stats: arrayOf(shape({}))
  })
}

ResultTabs.defaultProps = {
  comparison: undefined
}

export default ResultTabs

