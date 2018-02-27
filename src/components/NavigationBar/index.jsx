import React, { Component } from 'react';
import { Menu } from 'semantic-ui-react';
import { Link, withRouter } from 'react-router-dom';
import { func, string, shape } from 'prop-types';

import { routes } from '../../constants';

import styles from './navigationBar.css';

class NavigationBar extends Component {
  static propTypes = {
    translate: func.isRequired,
    location: shape({
      pathname: string.isRequired
    })
  };
  static defaultProps = {
    location: {
      pathname: '/'
    }
  };

  state = { };

  componentDidMount() {
    const { pathname } = this.props.location;
    this.setState({ pathname });
  }

  checkActiveRoute = (route) => {
    const { pathname } = this.state;
    return pathname && (pathname === '/' || (route.length > 1 && pathname.includes(route)));
  };

  checkForOptionalParams = route => (
    route.endsWith('?') ? route.slice(0, route.indexOf('/:')) : route
  );

  render() {
    const t = this.props.translate;

    const menuWidth = Object.keys(routes).length + 1;

    return (
      <Menu stackable fluid widths={menuWidth} className={styles.navBar}>
        <Menu.Item
          as={Link}
          to={routes.index.route}
          onClick={() => this.setState({ pathname: routes.index.route })}
        >
          <span className={styles.logo}>
            <h2 className={styles.logoText}>oodikone</h2>
          </span>
        </Menu.Item>
        {
          Object.values(routes).map((value) => {
            const viewableRoute = this.checkForOptionalParams(value.route);
            return (
              <Menu.Item
                as={Link}
                key={`menu-item-${viewableRoute}`}
                to={this.checkForOptionalParams(viewableRoute)}
                active={this.checkActiveRoute(viewableRoute)}
                onClick={() => this.setState({ pathname: viewableRoute })}
              >
                {t(`navigationBar.${value.translateId}`)}
              </Menu.Item>
            );
          })
          }
      </Menu>);
  }
}

export default withRouter(NavigationBar);

