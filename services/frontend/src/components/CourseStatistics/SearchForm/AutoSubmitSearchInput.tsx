import { useEffect, useState } from 'react'
import { Input } from 'semantic-ui-react'

import { Timeout } from '@/components/Timeout'

enum Timeouts {
  FETCH = 'fetch',
  SEARCH = 'search',
}

interface AutoSubmitSearchInputProps {
  cypress: string
  doSearch: (searchTerm: string) => void
  inputValue: string
  loading: boolean
  onChange: (searchTerm: string) => void
  setTimeout: (timeout: Timeouts, callback: () => void, latency: number) => void
  placeholder: string
}

const AutoSubmitSearchInput = ({
  cypress,
  doSearch,
  inputValue,
  loading,
  onChange,
  setTimeout,
  placeholder,
}: AutoSubmitSearchInputProps) => {
  const [input, setInput] = useState(inputValue)
  const latency = 250
  const minSearchLength = 0

  const executeSearch = (searchTerm: string) => {
    clearTimeout(Timeouts.FETCH)
    setTimeout(Timeouts.FETCH, () => doSearch(searchTerm), latency)
  }

  useEffect(() => {
    if ((input || input === '') && input.length >= minSearchLength) {
      executeSearch(input)
    }
  }, [input])

  const handleSearchChange = (_event, { value }) => {
    clearTimeout(Timeouts.SEARCH)
    if (value.length >= 0) {
      onChange(value)
      setTimeout(Timeouts.SEARCH, () => setInput(value), latency)
    } else {
      onChange('')
    }
  }
  return (
    <Input
      data-cy={cypress}
      fluid
      icon="search"
      loading={loading}
      onChange={handleSearchChange}
      placeholder={placeholder}
      value={inputValue}
    />
  )
}

export const TimeoutAutoSubmitSearchInput = Timeout(AutoSubmitSearchInput)
