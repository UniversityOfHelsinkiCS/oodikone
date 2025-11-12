// For information about this implementation, see.
// https://mui.com/material-ui/integrations/routing/
//
import LinkContainer, { LinkProps } from '@mui/material/Link'
import { forwardRef } from 'react'
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router'

export const Link = forwardRef<HTMLAnchorElement, LinkProps & RouterLinkProps>((props, ref) => (
  <LinkContainer component={RouterLink} ref={ref} {...props} />
))

Link.displayName = 'OKLink'
