/* eslint-disable react/no-children-prop */
import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import changelogApi from 'redux/changelog'
import { Button, Divider, Header, Loader } from 'semantic-ui-react'

const { useGetChangelogQuery } = changelogApi

const Changelog = () => {
  const [showAll, setShowAll] = useState()
  const [itemsToShow, setItemsToShow] = useState([])
  const { data, isLoading } = useGetChangelogQuery()

  useEffect(() => {
    if (!data) return
    setItemsToShow(showAll ? [...data.slice(0, 20)] : [...data.slice(0, 2)])
  }, [data, showAll])

  const getReleaseString = release => {
    const date = new Date(release.time).toLocaleString()
    const { title } = release
    const description = release.description.split('### Internal')[0]
    return `## ${title}\n${date}\n\n${description}`
  }
  if (isLoading) {
    return <Loader />
  }
  if (!data) {
    return null
  }
  return (
    <div>
      <Header as="h1">Changelog</Header>
      {itemsToShow.map(release => (
        <div>
          <Divider section />
          <ReactMarkdown children={getReleaseString(release)} />
        </div>
      ))}
      <Button style={{ marginTop: '15px' }} onClick={() => setShowAll(!showAll)}>
        {showAll ? 'Show less' : 'Show more'}
      </Button>
    </div>
  )
}

export default Changelog
