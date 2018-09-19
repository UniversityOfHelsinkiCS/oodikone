import React, { Component } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { localize } from 'react-localize-redux'
import { Loader } from 'semantic-ui-react'

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

import styles from './main.css'

import { userIsEnabled, log } from '../../common'

class Main extends Component {
  state = {
    enabled: false,
    hasError: false,
    loaded: false
  }

  async componentDidMount() {
    const enabled = await userIsEnabled()
    if (!enabled) {
      log('Not enabled')
    }
    this.setState({ enabled, loaded: true })
  }

  componentDidCatch() {
    this.setState({ hasError: true, loaded: true })
  }

  render() {
    console.log('Wed May 30 19:55:39 EEST 2018') // eslint-disable-line
    if (!this.state.loaded) {
      return <Loader active inline="centered" />
    }
    if (!this.state.enabled || this.state.hasError) {
      return <AccessDenied itWasError={this.state.hasError} />
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
            </Switch>
          </main>
        </Router>
      </div>
    )
  }
}

export default localize(Main, 'locale')

