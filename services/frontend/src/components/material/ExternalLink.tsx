import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import Link, { LinkOwnProps } from '@mui/material/Link'

/**
 * Link that opens an external website in a new tab
 *
 * @param href - URL of the external website
 * @param text - Text to display in the link
 * @param cypress - Cypress data-cy attribute
 * @param variant - Typography variant for the link text
 */
export const ExternalLink = ({
  href,
  text,
  cypress,
  variant = 'body2',
}: {
  href: string
  text: string
  cypress?: string
  variant?: LinkOwnProps['variant']
}) => {
  return (
    <Link
      data-cy={cypress}
      href={href}
      rel="noopener noreferrer"
      sx={{ alignItems: 'center', display: 'inline-flex', gap: 0.5 }}
      target="_blank"
      variant={variant}
    >
      {text}
      <OpenInNewIcon fontSize="inherit" />
    </Link>
  )
}
