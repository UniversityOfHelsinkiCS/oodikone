import React, { Component } from 'react'
import { connect } from 'react-redux'
import { arrayOf, func, string, bool } from 'prop-types'
import { sortBy } from 'lodash'
import { Loader } from 'semantic-ui-react'
import { getDegreesAndProgrammes } from '../../../redux/populationDegreesAndProgrammes'
import Table from '../../SearchResultTable'

const headers = [
  'name',
  'code'
]

class StudyProgrammeSelector extends Component {
  static propTypes = {
    getDegreesAndProgrammes: func.isRequired,
    handleSelect: func.isRequired,
    studyprogrammes: arrayOf(arrayOf(string)), // eslint-disable-line
    selected: bool.isRequired
  }

  componentDidMount() {
    if (!this.props.studyprogrammes) {
      this.props.getDegreesAndProgrammes()
    }
  }

  render() {
    const { studyprogrammes, selected } = this.props
    if (selected) return null
    if (!studyprogrammes) return <Loader active>Loading</Loader>
    return (
      <Table
        headers={headers}
        rows={studyprogrammes}
        rowClickFn={(e, row) => this.props.handleSelect(row)}
        selectable
        noResultText="No study programmes"
      />
    )
  }
}

const mapStateToProps = ({ populationDegreesAndProgrammes, settings }) => {
  const { programmes } = populationDegreesAndProgrammes.data
  const { language } = settings

  return {
    studyprogrammes: programmes ? sortBy(Object.values(programmes).filter(programme =>
      programme.code.includes('_'))
      .map(programme => [programme.name[language], programme.code]), '0') : null
  }
}

export default connect(mapStateToProps, { getDegreesAndProgrammes })(StudyProgrammeSelector)
