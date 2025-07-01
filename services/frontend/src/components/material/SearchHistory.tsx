import AccessTimeIcon from '@mui/icons-material/AccessTime'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { sortBy } from 'lodash'
import { useEffect, useState } from 'react'

import { DateFormat } from '@/constants/date'
import { SearchHistoryItem } from '@/types/searchHistory'
import { formatDate } from '@/util/timeAndDate'

export const SearchHistory = ({
  handleSearch,
  header = 'Previous searches',
  items,
  updateItem,
}: {
  handleSearch: (params: any) => void
  header?: string
  items: SearchHistoryItem[]
  updateItem?: (arg: SearchHistoryItem) => void
}) => {
  const [selected, setSelected] = useState<SearchHistoryItem | null>(null)

  const sortedItems = sortBy(items, item => -new Date(item.timestamp!).getTime())

  const handleChange = (_event: React.SyntheticEvent, newValue: SearchHistoryItem | null) => {
    if (!newValue) {
      handleSearch(null)
    } else {
      handleSearch(newValue.params)
    }
    setSelected(newValue)

    if (updateItem) {
      const target = sortedItems.find(item => item.id === newValue?.id)
      if (target) updateItem(target)
    }
  }

  useEffect(() => {
    if (selected === null) return
    if (items.every(item => item.id !== selected.id)) {
      setSelected(null)
    }
  }, [items, selected])

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack alignItems="center" direction="row" spacing={1} sx={{ marginBottom: 2 }}>
          <Stack alignItems="center">
            <AccessTimeIcon />
          </Stack>
          <Typography variant="h6">{header}</Typography>
        </Stack>
        {sortedItems.length > 0 ? (
          <Autocomplete
            getOptionLabel={option => option.text}
            onChange={handleChange}
            options={sortedItems}
            renderInput={params => <TextField {...params} data-cy="history-search" label="Select a previous search" />}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props
              return (
                <Box component="li" key={key} {...optionProps}>
                  <Stack direction="row" justifyContent="space-between" sx={{ width: '100%' }}>
                    {option.text}
                    <Typography color="text.secondary">
                      {formatDate(option.timestamp, DateFormat.DISPLAY_DATE_DEV)}
                    </Typography>
                  </Stack>
                </Box>
              )
            }}
            value={selected}
          />
        ) : (
          <Typography color="text.secondary">You have no previous searches.</Typography>
        )}
      </CardContent>
    </Card>
  )
}
