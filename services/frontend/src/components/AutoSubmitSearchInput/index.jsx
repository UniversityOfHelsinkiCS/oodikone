import { func, string } from 'prop-types'
import { useEffect, useState } from 'react'
import { Input } from 'semantic-ui-react'

import { Timeout } from '@/components/Timeout'

const TIMEOUTS = {
  FETCH: 'fetch',
  SEARCH: 'search',
}

const AutoSubmitSearchInput = ({
  clearAllTimeouts,
  clearTimeout,
  onChange,
  setTimeout,
  value,
  latency = 250,
  placeholder,
  minSearchLength = 0,
  doSearch,
  loading = false,
  disabled = false,
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

  const handleSearchChange = (_event, { value: val }) => {
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
      disabled={disabled}
      fluid
      icon="search"
      loading={loading}
      onChange={handleSearchChange}
      placeholder={placeholder}
      value={value}
      {...rest}
    />
  )
}

AutoSubmitSearchInput.propTypes = {
  clearAllTimeouts: func.isRequired,
  clearTimeout: func.isRequired,
  setTimeout: func.isRequired,
  doSearch: func.isRequired,
  placeholder: string.isRequired,
  value: string.isRequired,
  onChange: func.isRequired,
}

export const TimeoutAutoSubmitSearchInput = Timeout(AutoSubmitSearchInput)
