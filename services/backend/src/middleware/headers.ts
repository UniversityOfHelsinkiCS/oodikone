import headersMiddleware from 'unfuck-utf8-headers-middleware'

const headersToska = ['uid', 'displayName', 'shib-session-id', 'hyGroupCn', 'mail', 'hyPersonSisuId']

const headers = headersToska

export default headersMiddleware(headers)
