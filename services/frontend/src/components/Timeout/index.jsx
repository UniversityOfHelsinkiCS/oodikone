import React, { Component } from 'react'

export const Timeout = Composition =>
  class _Timeout extends Component {
    componentDidMount() {
      this.timeouts = {}
    }

    componentWillUnmount() {
      this.clearAllTimeouts()
    }

    setTimeout = (identifier, ...args) => {
      this.timeouts[identifier] = setTimeout(...args)
    }

    clearTimeout = identifier => {
      if (this.timeouts[identifier]) {
        clearTimeout(this.timeouts[identifier])
      }
    }

    clearAllTimeouts = () => {
      Object.keys(this.timeouts)
        .map(key => this.timeouts[key])
        .forEach(clearTimeout)
      this.timeouts = {}
    }

    render() {
      const { timeouts, setTimeout, clearTimeout, clearAllTimeouts } = this

      return (
        <Composition
          timeouts={timeouts}
          setTimeout={setTimeout}
          clearTimeout={clearTimeout}
          clearAllTimeouts={clearAllTimeouts}
          {...this.props}
        />
      )
    }
  }
