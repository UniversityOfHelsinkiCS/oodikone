import React from 'react'
import { Segment } from 'semantic-ui-react'
import { Switch, Route, Link, useRouteMatch, useHistory } from 'react-router-dom'
import { useTitle } from '../../common/hooks'

import { ProtoC } from '../CoolDataScience/ProtoC'
import { ProtoC2 } from '../CoolDataScience/ProtoC2'
import { ConnectedProtoG as ProtoG } from '../CoolDataScience/ProtoG'
import { StatusPanel } from '../CoolDataScience/StatusPanel'
import relativeGraphImg from '../../assets/graph-relative.png'
import absoluteGraphImg from '../../assets/graph-absolute.png'
import timelineGraphImg from '../../assets/graph-timeline.png'
import statusImg from '../../assets/status.png'

import '../CoolDataScience/CoolDataScience.css'

const NavTile = ({ to, title, imageSrc }) => {
  const match = useRouteMatch({ path: to, exact: true })
  const active = !!match

  return (
    <Segment
      style={{ margin: 0 }}
      className={`cool-data-science-tile ${active ? 'cool-data-science-tile--active' : ''}`}
    >
      <Link to={to} className="cool-data-science-tile__link">
        <p className="cool-data-science-tile__title">{title}</p>
        <img className="cool-data-science-tile__image" alt={title} src={imageSrc} />
      </Link>
    </Segment>
  )
}

const NavTiles = ({ children }) => {
  return <div className="cool-ds-nav-tiles">{children}</div>
}

const baseURI = '/trends'

export const Trends = () => {
  useTitle('Trends')
  const history = useHistory()
  const match = useRouteMatch({ path: baseURI, exact: true })
  const exact = !!match
  if (exact) {
    history.replace(`${baseURI}/status`)
  }
  return (
    <>
      <div style={{ margin: '0 auto', maxWidth: '1000px' }}>
        <NavTiles>
          <NavTile to={`${baseURI}/status`} title="See current status" imageSrc={statusImg} />
          <NavTile to={`${baseURI}/relative`} title="Compare relative trends" imageSrc={relativeGraphImg} />
          <NavTile to={`${baseURI}/absolute`} title="Compare numerical trends" imageSrc={absoluteGraphImg} />
          <NavTile to={`${baseURI}/timeline`} title="Compare trends over time" imageSrc={timelineGraphImg} />
        </NavTiles>
      </div>
      <div style={{ margin: '0 auto', marginBottom: '300px', maxWidth: '75vw' }}>
        <Switch>
          <Route exact path={`${baseURI}/status`} component={StatusPanel} />
          <Route exact path={`${baseURI}/relative`} component={ProtoC} />
          <Route exact path={`${baseURI}/absolute`} component={ProtoC2} />
          <Route exact path={`${baseURI}/timeline`} component={ProtoG} />
        </Switch>
      </div>
    </>
  )
}
