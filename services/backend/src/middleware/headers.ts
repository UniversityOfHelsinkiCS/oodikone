import headersMiddleware from 'unfuck-utf8-headers-middleware'

import { serviceProvider } from '../config'

const headersToska = ['uid', 'displayName', 'shib-session-id', 'hyGroupCn', 'mail', 'hyPersonSisuId']
const headersOther = ['remote_user']

const headers = serviceProvider === 'toska' ? headersToska : headersOther

export default headersMiddleware(headers)
