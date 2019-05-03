import React, { Component, Suspense } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { localize } from 'react-localize-redux'
import { Loader, Image, Transition } from 'semantic-ui-react'
import { shape } from 'prop-types'
import * as Sentry from '@sentry/browser'

import Header from '../Header'
import Populations from '../PopulationStatistics'
import ErrorContainer from '../ErrorContainer'
import { routes, BASE_PATH } from '../../constants'
import AccessDenied from '../AccessDenied'

import './main.css'

import { getUserName, userIsEnabled, log, images } from '../../common'

const WelcomePage = React.lazy(() => import('../WelcomePage'))
const StudentStatistics = React.lazy(() => import('../StudentStatistics'))
const CourseStatistics = React.lazy(() => import('../CourseStatistics'))
const EnableUsers = React.lazy(() => import('../EnableUsers'))
const Settings = React.lazy(() => import('../Settings'))
const StudyProgramme = React.lazy(() => import('../StudyProgramme'))
const Teachers = React.lazy(() => import('../Teachers'))
const Sandbox = React.lazy(() => import('../Sandbox'))
const UsageStatistics = React.lazy(() => import('../UsageStatistics'))
const OodiLearn = React.lazy(() => import('../OodiLearn'))

class Main extends Component {
  state = {
    enabled: false,
    hasError: false,
    loaded: false,
    easterEgg: false,
    networkError: false,
    guide: 'try refreshing your browser window, pressing log out or contacting grp-toska@helsinki.fi'
  }

  async componentDidMount() {
    const enabled = await userIsEnabled()
    if (!enabled) {
      log('Not enabled')
      setTimeout(
        () => this.setState({ easterEgg: true }),
        Math.floor(Math.random() * 1800000) + 600000
      )
    }
    this.setState({ enabled, loaded: true })
  }

  componentDidCatch = async (e) => {
    const { store } = this.props
    const name = await getUserName()
    const state = store.getState()
    Sentry.configureScope((scope) => {
      Object.keys(state).forEach((key) => {
        scope.setExtra(key, JSON.stringify(store[key]))
      })
      scope.setUser({ username: name })
    })
    Sentry.captureException(e)
    this.setState({ hasError: true, loaded: true })
  }

  setNetworkError = () => this.setState({
    guide: `Oodikone is unable to connect.
      Double check that you're in eduroam or have
      pulse security on. Refresh by pressing F5.`,
    networkError: true
  })

  render() {
    if (!this.state.loaded) {
      return <Loader active inline="centered" />
    }

    if (!this.state.enabled || this.state.hasError || this.state.networkError) {
      return (
        <div>
          <AccessDenied
            itWasError={this.state.hasError}
            guide={this.state.guide}
            networkError={this.state.networkError}
          />
          <Transition visible={this.state.easterEgg} animation="fly up" duration={10000}>
            <Image
              src={images.irtomikko}
              size="huge"
              verticalAlign="top"
              inline
              style={{ position: 'absolute', top: '350px', right: '10px' }}
            />
          </Transition>
        </div>
      )
    }
    return (
      <div className="appContainer">
        <Router basename={BASE_PATH}>
          <main className="routeViewContainer">
            <Header />
            <ErrorContainer />
            <Suspense fallback={<Loader active inline="centered" />}>
              <Switch>
                <Route exact path={routes.index.route} component={WelcomePage} />
                <Route exact path="/populations" component={Populations} />
                <Route exact path="/study-programme/:studyProgrammeId?" component={StudyProgramme} />
                <Route exact path="/study-programme/:studyProgrammeId/course-group/:courseGroupId" component={StudyProgramme} />
                <Route exact path={routes.students.route} component={StudentStatistics} />
                <Route exact path={routes.courseStatistics.route} component={CourseStatistics} />
                <Route exact path={routes.settings.route} component={Settings} />
                <Route exact path={routes.users.route} component={EnableUsers} />
                <Route exact path={routes.teachers.route} component={Teachers} />
                <Route exact path={routes.usage.route} component={UsageStatistics} />
                <Route exact path={routes.sandbox.route} component={Sandbox} />
                <Route exact path={routes.oodilearn.route} component={OodiLearn} />
              </Switch>
            </Suspense>
          </main>
        </Router>
      </div>
    )
  }
}

Main.propTypes = {
  store: shape({}).isRequired
}

export default localize(Main, 'locale')
