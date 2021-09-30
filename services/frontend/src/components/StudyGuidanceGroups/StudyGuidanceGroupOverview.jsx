import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import SortableTable from '../SortableTable'
import { getTextIn } from '../../common'
import StyledMessage from './StyledMessage'

const StudyGuidanceGroupOverview = () => {
  const { language } = useSelector(({ settings }) => settings)
  const { data: groups } = useSelector(({ studyGuidanceGroups }) => studyGuidanceGroups)
  const headers = [
    {
      key: 'name',
      title: 'name',
      getRowVal: group => getTextIn(group.name, language),
      getRowContent: group => (
        <Link
          style={{
            color: 'black',
            display: 'inline-block',
            width: '100%',
            height: '100%',
            padding: '.78571429em .78571429em',
          }}
          to={`/studyguidancegroups/${group.id}`}
        >
          {getTextIn(group.name, language)}
        </Link>
      ),
      cellProps: {
        style: {
          padding: '0',
        },
      },
    },
  ]

  if (groups.length === 0) {
    return <StyledMessage>You do not have access to any study guidance groups.</StyledMessage>
  }
  return (
    <>
      <StyledMessage>
        <p>Tällä sivulla pääset tarkastemaan ohjattavien opiskelijoidesi etenemistä ohjausryhmittäin.</p>
      </StyledMessage>
      <SortableTable columns={headers} getRowKey={group => group.id} data={groups} />
    </>
  )
}

export default StudyGuidanceGroupOverview
