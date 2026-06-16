// Babel config used by jest (babel-jest) only. The package itself builds with
// tsc; this just lets jest transform TS/TSX test + source files.
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
};
