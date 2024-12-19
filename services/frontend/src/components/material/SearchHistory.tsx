import { AccessTime as AccessTimeIcon } from '@mui/icons-material'
import { Autocomplete, Box, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import { sortBy } from 'lodash'
import moment from 'moment'
import { useEffect, useState } from 'react'

import { DISPLAY_DATE_FORMAT_DEV } from '@/constants/date'

type ListItem = {
  id: string
  text: string
  timestamp: string
  params: any
}

export const SearchHistory = ({
  handleSearch,
  header = 'Previous searches',
  items,
}: {
  handleSearch: (params: any) => void
  header?: string
  items: ListItem[]
}) => {
  const [selected, setSelected] = useState<ListItem | null>(null)

  const sortedItems = sortBy(items, item => -new Date(item.timestamp).getTime())

  const handleChange = (_event: React.SyntheticEvent, newValue: ListItem | null) => {
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
