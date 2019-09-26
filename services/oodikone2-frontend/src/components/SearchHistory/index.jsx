import React, { useState } from 'react'
import moment from 'moment'
import { sortBy } from 'lodash'
import { Segment, Form, Header } from 'semantic-ui-react'
import { arrayOf, date, func, shape, string, bool } from 'prop-types'

const SearchHistory = ({ items, handleSearch, updateItem, disabled }) => {
  const [selected, setSelected] = useState(null)

  const sortedItems = sortBy(items, i => -new Date(i.timestamp).getTime())

  const handleChange = (e, { value }) => {
    if (disabled) return
    setSelected(value)
    handleSearch(sortedItems[value - 1].params)
    updateItem(sortedItems[value - 1])
  }

  return (
    <Segment>
      <Header disabled={disabled} content="Previous searches" icon="clock outline" />
      <Form.Dropdown
        disabled={disabled}
        placeholder="Select a previous search"
        noResultsMessage="No previous searches"
        search
        selection
        value={selected}
        options={sortedItems.map(({ text, timestamp }, i) => ({
          key: i + 1,
          value: i + 1,
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
  disabled: false
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
  disabled: bool
}

export default SearchHistory
