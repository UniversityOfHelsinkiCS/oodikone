import { sortBy } from 'lodash'
import moment from 'moment'
import { useState } from 'react'
import { Form, Header, HeaderContent, Icon, Segment } from 'semantic-ui-react'

import { DISPLAY_DATE_FORMAT_DEV } from '@/constants/date'

export const SearchHistory = ({ disabled, handleSearch, header = 'Previous searches', items, updateItem }) => {
  const [selected, setSelected] = useState(null)

  const sortedItems = sortBy(items, item => -new Date(item.timestamp).getTime())

  const handleChange = (_event, { value }) => {
    if (!value) {
      handleSearch(null)
      setSelected(null)
      return
    }
    if (disabled) {
      return
    }
    setSelected(value)
    const target = sortedItems.find(item => item.id === value)
    handleSearch(target.params)
    updateItem(target)
  }

  return (
    <Segment>
      <Header disabled={disabled} size="small">
        <Icon name="clock outline" />
        <HeaderContent>{header}</HeaderContent>
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
          description: moment(timestamp).format(DISPLAY_DATE_FORMAT_DEV),
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
