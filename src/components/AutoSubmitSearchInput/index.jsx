import React from 'react'
import { Input } from 'semantic-ui-react'
import { func, string, number, bool } from 'prop-types'
import Timeout from '../Timeout'

const TIMEOUTS = {
  FETCH: 'fetch',
  SEARCH: 'search'
}

const AutoSubmitSearchInput = ({
  clearTimeout,
  onChange,
  setTimeout,
  icon,
  value,
  latency,
  placeholder,
  minSearchLength,
  doSearch,
  loading,
  disabled
}) => {
  const resetComponent = () => {
    onChange('')
  }

  const executeSearch = (searchterm) => {
    setTimeout(TIMEOUTS.FETCH, () => {
    }, latency)
    doSearch(searchterm).then(() => {
      clearTimeout(TIMEOUTS.FETCH)
    })
  }

  const handleSearchChange = (e, { value: val }) => {
    clearTimeout(TIMEOUTS.SEARCH)
    if (val.length >= 0) {
      onChange(val)
      if (val.length >= minSearchLength) {
        setTimeout(TIMEOUTS.SEARCH, () => {
          executeSearch(val)
        }, latency)
      }
    } else {
      resetComponent()
    }
  }
  return (
    <Input
      fluid
      icon={icon}
      value={value}
      onChange={handleSearchChange}
      placeholder={placeholder}
      loading={loading}
      disabled={disabled}
    />
  )
}

AutoSubmitSearchInput.propTypes = {
  clearTimeout: func.isRequired,
  setTimeout: func.isRequired,
  doSearch: func.isRequired,
  placeholder: string,
  icon: string,
  latency: number,
  minSearchLength: number,
  value: string.isRequired,
  onChange: func.isRequired,
  loading: bool,
  disabled: bool
}

AutoSubmitSearchInput.defaultProps = {
  placeholder: 'Search...',
  icon: 'search',
  latency: 250,
  minSearchLength: 4,
  loading: false,
  disabled: false
}

export default Timeout(AutoSubmitSearchInput)
