module.exports = {
  meta: {
    name: 'oodikone',
  },
  rules: {
    'no-date-now': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Require the backend clock helper instead of Date.now()',
        },
        schema: [],
        messages: {
          useNow: 'Use now().getTime() instead of Date.now() so the current time can be controlled in tests.',
        },
      },
      create(context) {
        return {
          CallExpression(node) {
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'Date' &&
              node.callee.property.type === 'Identifier' &&
              node.callee.property.name === 'now' &&
              node.arguments.length === 0
            ) {
              context.report({ node, messageId: 'useNow' })
            }
          },
        }
      },
    },
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
