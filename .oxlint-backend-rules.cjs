module.exports = {
  meta: {
    name: 'oodikone',
  },
  rules: {
    'no-new-date': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Require the backend clock helper for the current date',
        },
        schema: [],
        messages: {
          useNow: 'Use now() instead of new Date() so the current time can be controlled in tests.',
        },
      },
      create(context) {
        return {
          NewExpression(node) {
            if (node.callee.type === 'Identifier' && node.callee.name === 'Date' && node.arguments.length === 0) {
              context.report({ node, messageId: 'useNow' })
            }
          },
        }
      },
    },
  },
}
