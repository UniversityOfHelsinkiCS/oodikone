import AccessTimeIcon from '@mui/icons-material/AccessTime'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { sortBy } from 'lodash'
import moment from 'moment'
import { useEffect, useState } from 'react'

import { DISPLAY_DATE_FORMAT_DEV } from '@/constants/date'
import { SearchHistoryItem } from '@/types/searchHistory'

export const SearchHistory = ({
  handleSearch,
  header = 'Previous searches',
  items,
}: {
  handleSearch: (params: any) => void
  header?: string
  items: SearchHistoryItem[]
}) => {
  const [selected, setSelected] = useState<SearchHistoryItem | null>(null)

  const sortedItems = sortBy(items, item => -new Date(item.timestamp!).getTime())

  const handleChange = (_event: React.SyntheticEvent, newValue: SearchHistoryItem | null) => {
    if (newValue === null) {
      handleSearch(newValue)
    } else {
      handleSearch(newValue.params)
    }
    setSelected(newValue)
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
                      {moment(option.timestamp).format(DISPLAY_DATE_FORMAT_DEV)}
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
