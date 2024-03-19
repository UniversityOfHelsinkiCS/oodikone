import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Divider, Header, Loader } from 'semantic-ui-react'

import { builtAt } from '@/conf'
import { useGetChangelogQuery } from '@/redux/changelog'

export const Changelog = ({ showFullChangelog }) => {
  const [itemsToShow, setItemsToShow] = useState([])
  const { data, isLoading } = useGetChangelogQuery()

  const filterInternalReleases = release => !release.title.startsWith('Internal:')

  useEffect(() => {
    if (!data) return
    setItemsToShow(
      showFullChangelog
        ? [...data.filter(filterInternalReleases).slice(0, 20)]
        : [...data.filter(filterInternalReleases).slice(0, 2)]
    )
  }, [data, showFullChangelog])

  const formatDate = dateString => {
    const date = new Date(dateString)
    const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' })
    return dateFormatter.format(date)
  }

  function getDescription(string) {
    const lines = string.split('\n')
    const internalIndex = lines.findIndex(line => line.toLowerCase().includes('internal'))
    if (internalIndex === -1 || internalIndex === 0) {
      return string
    }
    return lines.slice(0, internalIndex).join('\n')
  }

  const getReleaseString = release => {
    const date = formatDate(release.time)
    const description = getDescription(release.description)
    const releaseString = showFullChangelog
      ? `## ${release.title}\n${date}\n\n${description}`
      : `#### ${release.title}\n${description}`
    return releaseString
  }

  if (isLoading || itemsToShow.length === 0) return <Loader />

  return (
    <div>
      {!showFullChangelog && (
        <>
          <Header as="h3">Updates</Header>
          <p>Last update on: {builtAt ? formatDate(builtAt) : formatDate(itemsToShow[0].time)}</p>
        </>
      )}
      {itemsToShow.map(release => (
        <div key={release.time}>
          <Divider section />
          <ReactMarkdown>{getReleaseString(release)}</ReactMarkdown>
        </div>
      ))}
    </div>
  )
}
