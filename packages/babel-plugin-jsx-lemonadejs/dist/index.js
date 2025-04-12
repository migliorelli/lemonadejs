module.exports = function(babel) {
  const { types: t } = babel;

  return {
    name: 'babel-plugin-transform-jsx-to-lemonade-template',
    visitor: {
      ReturnStatement(path) {
        if (t.isJSXElement(path.node.argument) || t.isJSXFragment(path.node.argument)) {
          let content = path.get('argument').getSource();

          // Clean up newlines and extra spaces
          content = content.replace(/\n\s*/g, ' ').trim();

          // Replace JSX expressions
          content = content.replace(/{([^}]+)}/g, (match, expr) => {
            // Handle special cases for event handlers
            if (expr.includes('onClick=')) {
              return expr.replace('onClick=', 'onclick=');
            }
            return '${' + expr + '}';
          });

          // Create template literal with proper escaping
          const escaped = content.replace(/`/g, '\\`');

          const wrappedContent = babel.parse(`render\`<>${escaped}</>\``).program.body[0].expression;

          const arrowFunction = t.arrowFunctionExpression(
              [t.identifier('render')],
              wrappedContent
          );

          path.replaceWith(t.returnStatement(arrowFunction));
        }
      }
    }
  };
};