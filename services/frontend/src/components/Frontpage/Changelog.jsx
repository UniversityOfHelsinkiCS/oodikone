/* eslint-disable react/no-children-prop */
import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import changelogApi from 'redux/changelog'
import { Divider, Header, Loader } from 'semantic-ui-react'
import { builtAt } from '../../conf'

const { useGetChangelogQuery } = changelogApi

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

  const getReleaseString = release => {
    const date = formatDate(release.time)
    const { title } = release
    const description = release.description.split('### Internal')[0]
    const releaseString = showFullChangelog ? `## ${title}\n${date}\n\n${description}` : `#### ${title}\n${description}`
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
          <ReactMarkdown children={getReleaseString(release)} />
        </div>
      ))}
    </div>
  )
}
