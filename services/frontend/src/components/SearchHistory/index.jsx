import { sortBy } from 'lodash'
import moment from 'moment'
import { arrayOf, func, shape, string, bool, instanceOf, oneOfType } from 'prop-types'
import React, { useState } from 'react'
import { Segment, Form, Header, Icon } from 'semantic-ui-react'

export const SearchHistory = ({ items, handleSearch, updateItem, disabled, header }) => {
  const [selected, setSelected] = useState(null)

  const sortedItems = sortBy(items, i => -new Date(i.timestamp).getTime())

  const handleChange = (_event, { value }) => {
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
      <Header disabled={disabled}>
        <>
          <Icon name="clock outline" />
          {header}
        </>
      </Header>
      <Form.Dropdown
        clearable
        closeOnChange
        data-cy="history-search"
        disabled={disabled}
        fluid
        noResultsMessage="No previous searches"
        onChange={handleChange}
        options={sortedItems.map(({ id, text, timestamp }) => ({
          key: id,
          value: id,
          text,
          description: moment(timestamp).format('DD.MM.YYYY LT'),
        }))}
        placeholder="Select a previous search"
        search
        selectOnBlur={false}
        selectOnNavigation={false}
        selection
        value={selected}
      />
    </Segment>
  )
}

SearchHistory.defaultProps = {
  disabled: false,
  header: 'Previous searches',
}

SearchHistory.propTypes = {
  items: arrayOf(
    shape({
      text: string,
      params: shape({}),
      timestamp: oneOfType([instanceOf(Date), string]),
    })
  ).isRequired,
  handleSearch: func.isRequired,
  updateItem: func.isRequired,
  disabled: bool,
  header: string,
}
