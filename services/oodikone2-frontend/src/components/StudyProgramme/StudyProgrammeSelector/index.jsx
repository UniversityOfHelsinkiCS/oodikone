import React, { Component } from 'react'
import { connect } from 'react-redux'
import { arrayOf, func, string, bool, shape } from 'prop-types'
import { Loader, Message } from 'semantic-ui-react'
import { getDegreesAndProgrammes } from '../../../redux/populationDegreesAndProgrammes'
import { getTextIn } from '../../../common'
import SortableTable from '../../SortableTable'

class StudyProgrammeSelector extends Component {
  static propTypes = {
    getDegreesAndProgrammes: func.isRequired,
    handleSelect: func.isRequired,
    studyprogrammes: arrayOf(shape({ name: shape({}), code: string })),
    selected: bool.isRequired,
    language: string.isRequired
  }

  static defaultProps = {
    studyprogrammes: null
  }

  componentDidMount() {
    if (!this.props.studyprogrammes) {
      this.props.getDegreesAndProgrammes()
    }
  }

  render() {
    const { studyprogrammes, selected, language } = this.props
    if (selected) return null
    if (!studyprogrammes) return <Loader active>Loading</Loader>

    const headers = [
      {
        key: 'name',
        title: 'name',
        getRowVal: prog => getTextIn(prog.name, language)
      },
      {
        key: 'code',
        title: 'code',
        getRowVal: prog => prog.code
      }
    ]
    if (studyprogrammes == null) {
      return <Message>You do not have access to any programmes</Message>
    }
    return (
      <SortableTable
        columns={headers}
        getRowKey={programme => programme.code}
        getRowProps={programme => ({ onClick: () => this.props.handleSelect(programme.code), style: { cursor: 'pointer' } })}
        data={studyprogrammes}
        defaultdescending
      />
    )
  }
}

const mapStateToProps = ({ populationDegreesAndProgrammes, settings }) => {
  const { programmes } = populationDegreesAndProgrammes.data
  const { language } = settings

  return {
    studyprogrammes: programmes ? Object.values(programmes).filter(programme =>
      programme.code.includes('_')) : null,
    language
  }
}

export default connect(mapStateToProps, { getDegreesAndProgrammes })(StudyProgrammeSelector)
