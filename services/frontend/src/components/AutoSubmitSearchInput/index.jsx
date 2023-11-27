import React, { useState, useEffect } from 'react'
import { Input } from 'semantic-ui-react'
import { func, string, number, bool } from 'prop-types'
import { Timeout } from '../Timeout'

const TIMEOUTS = {
  FETCH: 'fetch',
  SEARCH: 'search',
}

const AutoSubmitSearchInput = ({
  clearAllTimeouts,
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
  disabled,
  ...rest
}) => {
  const [input, setInput] = useState(value)

  const executeSearch = searchterm => {
    clearTimeout(TIMEOUTS.FETCH)
    setTimeout(TIMEOUTS.FETCH, () => doSearch(searchterm), latency)
  }

  useEffect(() => {
    if ((input || input === '') && input.length >= minSearchLength) {
      executeSearch(input)
    }
  }, [input])

  const resetComponent = () => {
    onChange('')
  }

  const handleSearchChange = (e, { value: val }) => {
    clearTimeout(TIMEOUTS.SEARCH)
    if (val.length >= 0) {
      onChange(val)
      setTimeout(
        TIMEOUTS.SEARCH,
        () => {
          setInput(val)
        },
        latency
      )
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
      {...rest}
    />
  )
}

AutoSubmitSearchInput.propTypes = {
  clearAllTimeouts: func.isRequired,
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
  disabled: bool,
}

AutoSubmitSearchInput.defaultProps = {
  placeholder: 'Search...',
  icon: 'search',
  latency: 250,
  minSearchLength: 0,
  loading: false,
  disabled: false,
}

export const TimeoutAutoSubmitSearchInput = Timeout(AutoSubmitSearchInput)
