import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, arrayOf, shape, oneOfType, number, string } from 'prop-types'
import { Segment } from 'semantic-ui-react'
import ResultTable from './ResultTable'
import AutoSubmitSearchInput from '../AutoSubmitSearchInput'
import { getPopulations } from '../../redux/oodilearnPopulations'
import selector from '../../selectors/oodilearnPopulations'

class PopulationSearch extends Component {
    state={}

    componentDidMount() {
      this.props.getPopulations()
    }

    render() {
      return (
        <Segment basic>
          <AutoSubmitSearchInput
            placeholder="Search for courses by name or code..."
            doSearch={() => {}}
            onChange={() => {}}
            value=""
            loading={false}
            disabled
          />
          <ResultTable
            nameTitle=""
            idTitle="Population ID"
            results={this.props.populations.map(({ id }) => ({
              id,
              handleClick: () => this.props.handleClick(id)
            }))}
          />
        </Segment>
      )
    }
}

PopulationSearch.propTypes = {
  handleClick: func.isRequired,
  getPopulations: func.isRequired,
  populations: arrayOf(shape({
    id: oneOfType([number, string])
  })).isRequired
}

const mapStateToProps = state => ({
  populations: selector.getPopulations(state)
})

export default connect(mapStateToProps, { getPopulations })(PopulationSearch)
