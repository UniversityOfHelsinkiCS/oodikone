import headersMiddleware from 'unfuck-utf8-headers-middleware'

const headers = ['uid', 'displayName', 'shib-session-id', 'hyGroupCn', 'mail', 'hyPersonSisuId']
export default headersMiddleware(headers)
