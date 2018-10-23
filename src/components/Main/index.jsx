import React, { Component } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { localize } from 'react-localize-redux'
import { Loader, Image, Transition } from 'semantic-ui-react'
import * as Sentry from '@sentry/browser'

import Header from '../Header'
import Populations from '../PopulationStatistics'
import WelcomePage from '../WelcomePage'
import StudentStatistics from '../StudentStatistics'
import CourseStatistics from '../CourseStatistics'
import EnableUsers from '../EnableUsers'
import Settings from '../Settings'
import ErrorContainer from '../ErrorContainer'
import { routes, BASE_PATH } from '../../constants'
import AccessDenied from '../AccessDenied'
import UsageStatistics from '../UsageStatistics'
import Teachers from '../Teachers'
import Sandbox from '../Sandbox'
import { callApi } from '../../apiConnection'

import styles from './main.css'

import { userIsEnabled, log, images } from '../../common'

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
    try {
      const res = await callApi('/ping')
      if (res.status !== 200) {
        this.setNetworkError()
      }
    } catch (e) {
      this.setNetworkError()
    }
    setInterval(async () => {
      try {
        const res = await callApi('/ping')
        if (res.status !== 200) {
          this.setNetworkError()
        }
      } catch (e) {
        this.setNetworkError()
      }
    }, 30000)
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

  setNetworkError = () => this.setState({ hasError: true, guide: 'Oodikone is unable to connect. Double check that you\'re in eduroam or have pulse security on. Refresh by pressing F5.', networkError: true })

  componentDidCatch(e) {
    Sentry.captureException(e)
    this.setState({ hasError: true, loaded: true })
  }

  render() {
    if (!this.state.loaded) {
      return <Loader active inline="centered" />
    }
    if (!this.state.enabled || this.state.hasError) {
      return (
        <div>
          <AccessDenied
            itWasError={this.state.hasError}
            guide={this.state.guide}
            networkError={this.state.networkError}
          />
          <Transition visible={this.state.easterEgg} animation="fly up" duration={10000}>
            <Image src={images.irtomikko} size="huge" verticalAlign="top" inline style={{ position: 'absolute', top: '350px', right: '10px' }} />
          </Transition>
        </div>
      )
    }
    return (
      <div className={styles.appContainer}>
        <Router basename={BASE_PATH}>
          <main className={styles.routeViewContainer}>
            <Header />
            <ErrorContainer />
            <Switch>
              <Route exact path={routes.index.route} component={WelcomePage} />
              <Route exact path={routes.populations.route} component={Populations} />
              <Route exact path={routes.students.route} component={StudentStatistics} />
              <Route exact path={routes.courseStatistics.route} component={CourseStatistics} />
              <Route exact path={routes.settings.route} component={Settings} />
              <Route exact path={routes.users.route} component={EnableUsers} />
              <Route exact path={routes.teachers.route} component={Teachers} />
              <Route exact path={routes.usage.route} component={UsageStatistics} />
              <Route exact path={routes.sandbox.route} component={Sandbox} />
            </Switch>
          </main>
        </Router>
      </div>
    )
  }
}

export default localize(Main, 'locale')

