module.exports = function(babel) {
  const { types: t } = babel;

  return {
    name: 'babel-plugin-transform-jsx-to-lemonade-template',
    visitor: {
      ReturnStatement(path) {
        if (t.isJSXElement(path.node.argument)) {
          const contentInsideParentheses = path.get('argument').getSource();

          const wrappedContent = babel.parse(`render\`${contentInsideParentheses}\``).program.body[0].expression;

          const arrowFunction = t.arrowFunctionExpression(
              [t.identifier('render')],
              wrappedContent
          );

          path.replaceWith(t.returnStatement(arrowFunction));
        }
      }
    }
  }
}