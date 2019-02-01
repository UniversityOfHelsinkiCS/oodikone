import React, { Component } from 'react'
import { connect } from 'react-redux'
import { shape, func, string, bool } from 'prop-types'
import { Loader } from 'semantic-ui-react'
import { sortBy } from 'lodash'
import { getDegreesAndProgrammes } from '../../../redux/populationDegreesAndProgrammes'
import Table from '../../SearchResultTable'

const headers = [
  'name',
  'code'
]

class StudyProgrammeSelector extends Component {
  static propTypes = {
    getDegreesAndProgrammes: func.isRequired,
    language: string.isRequired,
    handleSelect: func.isRequired,
    studyprogrammes: shape({}).isRequired,
    selected: bool.isRequired
  }

  componentDidMount() {
    if (this.props.studyprogrammes) {
      this.props.getDegreesAndProgrammes()
    }
  }

  render() {
    const { studyprogrammes, selected, language } = this.props
    if (!studyprogrammes) return <Loader active>Loading</Loader>

    if (selected) return null
    const rows = sortBy(Object.keys(studyprogrammes).reduce((res, key) => {
      if (studyprogrammes[key].type === 20) {
        res.push([
          studyprogrammes[key].name[language],
          key
        ])
      }
      return res
    }, []), '0')

    return (
      <Table
        headers={headers}
        rows={rows}
        rowClickFn={(e, row) => this.props.handleSelect(row)}
        selectable
        noResultText="No study programmes"
      />
    )
  }
}

const mapStateToProps = ({ populationDegreesAndProgrammes, settings }) => ({
  studyprogrammes: populationDegreesAndProgrammes.data || {},
  language: settings.language
})

export default connect(mapStateToProps, { getDegreesAndProgrammes })(StudyProgrammeSelector)
