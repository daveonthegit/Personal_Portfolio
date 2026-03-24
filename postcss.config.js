const fs = require('fs')
const path = require('path')
const postcss = require('postcss')

/** Same content Heroku/production used to get via package.json append after postcss — watch mode skipped that step. */
const appendNexusNewstylePlugin = {
  postcssPlugin: 'append-nexus-newstyle',
  OnceExit(root) {
    const filePath = path.join(__dirname, 'src/styles/nexus-newstyle.css')
    if (!fs.existsSync(filePath)) return
    const css = fs.readFileSync(filePath, 'utf8')
    const ast = postcss.parse(css, { from: filePath })
    root.append(ast.nodes)
  },
}

const plugins = [
  require('postcss-import'),
  require('tailwindcss'),
  require('autoprefixer'),
]

if (process.env.NODE_ENV === 'production') {
  plugins.push(require('cssnano')({}))
}

plugins.push(appendNexusNewstylePlugin)

module.exports = { plugins }
