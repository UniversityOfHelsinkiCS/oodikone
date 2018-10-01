import React, { Component } from 'react'
import { Input } from 'semantic-ui-react'
import { func, string, number } from 'prop-types'
import Timeout from '../Timeout'

const TIMEOUTS = {
  FETCH: 'fetch',
  SEARCH: 'search'
}

class AutoSubmitSearchInput extends Component {
    state = {
      searchterm: '',
      loading: false
    }

    resetComponent = () => {
      this.setState({ searchterm: '' })
    }

    executeSearch = (searchterm) => {
      this.setState({ loading: true })
      this.props.setTimeout(TIMEOUTS.FETCH, () => {
      }, this.props.latency)
      this.props.doSearch(searchterm).then(() => {
        this.props.clearTimeout(TIMEOUTS.FETCH)
        this.setState({ loading: false })
      })
    }

    handleSearchChange = (e, { value }) => {
      this.props.clearTimeout(TIMEOUTS.SEARCH)
      if (value.length > 0) {
        this.setState({ searchterm: value })
        if (value.length > this.props.minSearchLength) {
          this.props.setTimeout(TIMEOUTS.SEARCH, () => {
            this.executeSearch(value)
          }, this.props.latency)
        }
      } else {
        this.resetComponent()
      }
    }

    render() {
      return (
        <Input
          fluid
          icon={this.props.icon}
          value={this.state.searchterm}
          onChange={this.handleSearchChange}
          placeholder={this.props.placeholder}
          loading={this.state.loading}
        />
      )
    }
}

AutoSubmitSearchInput.propTypes = {
  clearTimeout: func.isRequired,
  setTimeout: func.isRequired,
  doSearch: func.isRequired,
  placeholder: string,
  icon: string,
  latency: number,
  minSearchLength: number
}

AutoSubmitSearchInput.defaultProps = {
  placeholder: 'Search...',
  icon: 'search',
  latency: 250,
  minSearchLength: 4
}

export default Timeout(AutoSubmitSearchInput)
