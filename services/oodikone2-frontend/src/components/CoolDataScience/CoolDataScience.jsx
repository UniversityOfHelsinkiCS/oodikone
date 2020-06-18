import React from 'react'
import PropTypes from 'prop-types'
import { Segment } from 'semantic-ui-react'
import { Switch, Route, Link, useRouteMatch } from 'react-router-dom'

import ProtoC from './ProtoC'
import ProtoC2 from './ProtoC2'
import ProtoG from './ProtoG'
import Status from './Status'
import Graduated from './StatusGraduated'
import relativeGraphImg from '../../assets/graph-relative.png'
import absoluteGraphImg from '../../assets/graph-absolute.png'
import timelineGraphImg from '../../assets/graph-timeline.png'
import statusImg from '../../assets/status.png'

import './CoolDataScience.css'

const NavTile = ({ to, title, imageSrc }) => {
  const match = useRouteMatch({ path: to, exact: true })
  const active = !!match

  return (
    <Segment
      style={{ margin: '0' }}
      className={`cool-data-science-tile ${active ? 'cool-data-science-tile--active' : ''}`}
    >
      <Link to={to} className="cool-data-science-tile__link">
        <p className="cool-data-science-tile__title">{title}</p>
        <img className="cool-data-science-tile__image" alt={title} src={imageSrc} />
      </Link>
    </Segment>
  )
}

NavTile.propTypes = {
  to: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  imageSrc: PropTypes.string.isRequired
}

const NavTiles = ({ children }) => {
  return <div className="cool-ds-nav-tiles">{children}</div>
}

NavTiles.propTypes = {
  children: PropTypes.node.isRequired
}

const baseURI = '/cool-data-science'

const CoolDataScience = () => {
  return (
    <>
      <div style={{ margin: '0 auto', maxWidth: '800px' }}>
        <NavTiles>
          <NavTile to={`${baseURI}/relative`} title="Compare relative trends" imageSrc={relativeGraphImg} />
          <NavTile to={`${baseURI}/absolute`} title="Compare numerical trends" imageSrc={absoluteGraphImg} />
          <NavTile to={`${baseURI}/timeline`} title="Compare trends over time" imageSrc={timelineGraphImg} />
          <NavTile to={`${baseURI}/status`} title="See current status" imageSrc={statusImg} />
          <NavTile to={`${baseURI}/lol`} title="See currentsss status" imageSrc={statusImg} />
        </NavTiles>
      </div>
      <div style={{ margin: '0 auto', marginBottom: '300px', maxWidth: '75vw' }}>
        <Switch>
          <Route exact path={`${baseURI}/relative`} component={ProtoC} />
          <Route exact path={`${baseURI}/absolute`} component={ProtoC2} />
          <Route exact path={`${baseURI}/timeline`} component={ProtoG} />
          <Route exact path={`${baseURI}/status`} component={Status} />
          <Route exact path={`${baseURI}/lol`} component={Graduated} />
        </Switch>
      </div>

      <hr />

      <div style={{ margin: '0 auto', maxWidth: '75vw' }}>
        <ProtoC />
        <ProtoC />
        <ProtoC2 />
        <ProtoC2 />
        <hr />
        <ProtoG />
        <ProtoG />
      </div>
    </>
  )
}

export default CoolDataScience
