import React, { useState } from 'react'
import moment from 'moment'
import { sortBy } from 'lodash'
import { Segment, Form, Header } from 'semantic-ui-react'
import { arrayOf, date, func, shape, string, bool } from 'prop-types'

const SearchHistory = ({ items, handleSearch, updateItem, disabled, header }) => {
  const [selected, setSelected] = useState(null)

  const sortedItems = sortBy(items, i => -new Date(i.timestamp).getTime())

  const handleChange = (e, { value }) => {
    if (!value) {
      handleSearch(null)
      setSelected(null)
      return
    }
    if (disabled) return
    setSelected(value)
    const target = sortedItems.find(i => i.id === value)
    handleSearch(target.params)
    updateItem(target)
  }

  return (
    <Segment>
      <Header disabled={disabled} content={header} icon="clock outline" />
      <Form.Dropdown
        disabled={disabled}
        placeholder="Select a previous search"
        noResultsMessage="No previous searches"
        search
        selection
        value={selected}
        options={sortedItems.map(({ id, text, timestamp }) => ({
          key: id,
          value: id,
          text,
          description: moment(timestamp).format('DD.MM LT')
        }))}
        onChange={handleChange}
        closeOnChange
        clearable
        fluid
        selectOnBlur={false}
        selectOnNavigation={false}
      />
    </Segment>
  )
}

SearchHistory.defaultProps = {
  disabled: false,
  header: 'Previous searches'
}

SearchHistory.propTypes = {
  items: arrayOf(
    shape({
      text: string,
      params: shape({}),
      timestamp: date
    })
  ).isRequired,
  handleSearch: func.isRequired,
  updateItem: func.isRequired,
  disabled: bool,
  header: string
}

export default SearchHistory
