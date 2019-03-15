import React from 'react'
import { Header, Loader } from 'semantic-ui-react'
import { shape, number, arrayOf, bool, string } from 'prop-types'
import SortableTable from '../../SortableTable'

const ThroughputTable = ({ throughput, loading, error }) => {
  const morethan = x => (total, amount) => amount >= x ? total + 1 : total // eslint-disable-line
  const columns = [
    { key: 'year', title: 'Start year', getRowVal: year => year.year },
    { key: 'students', title: 'Students', getRowVal: year => year.credits.length },
    { key: 'credits30', title: 'Credits >= 30', getRowVal: year => year.credits.reduce(morethan(30), 0) },
    { key: 'credits60', title: 'Credits >= 60', getRowVal: year => year.credits.reduce(morethan(60), 0) },
    { key: 'credits90', title: 'Credits >= 90', getRowVal: year => year.credits.reduce(morethan(90), 0) },
    { key: 'credits120', title: 'Credits >= 120', getRowVal: year => year.credits.reduce(morethan(120), 0) },
    { key: 'credits150', title: 'Credits >= 150', getRowVal: year => year.credits.reduce(morethan(150), 0) },
    { key: 'theses', title: 'Thesis', getRowVal: year => year.theses },
    { key: 'graduated', title: 'Graduated', getRowVal: year => year.graduated }
  ]
  if (error) return <h1>Oh no so error {error}</h1>
  return (
    <React.Fragment>
      <Header>Population progress</Header>
      <Loader active={loading} inline="centered">Loading...</Loader>
      <SortableTable columns={columns} data={throughput.filter(year => year.credits.length > 0)} getRowKey={row => row.year} />
    </React.Fragment>
  )
}

ThroughputTable.propTypes = {
  throughput: arrayOf(shape({
    year: string,
    credits: number,
    theses: number,
    graduated: number
  })).isRequired,
  loading: bool.isRequired,
  error: bool.isRequired
}

export default ThroughputTable
