var path = require('path');
var webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const ROOT_URI = 'https://studio.accordproject.org'; // No end '/' please

function resolveRootURI() {
    if (process.env.CONTEXT === 'production') {
        return ROOT_URI;
    } else {
        return process.env.DEPLOY_PRIME_URL || ROOT_URI;
    }
}

module.exports = {
  entry: {
    client: [
      './src/index.js'
    ]
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].bundle.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/index.html'
    }),
    new CopyWebpackPlugin([
      { from: 'static', to: 'static' }
    ]),
    new webpack.DefinePlugin({
      ROOT_URI: JSON.stringify(resolveRootURI()), // From Netlify
    }),
    new webpack.IgnorePlugin(/jsdom$/),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [path.join(__dirname, 'src')],
        use: ['babel-loader']
      },
      {
        test: /\.js$/,
        include: [/node_modules/],
        use: ['shebang-loader']
      },
      {
        test: /\.(ne|cta)$/,
        use:['raw-loader']
      },
      {
        test: /\.css$/,
        use: [ 'style-loader', 'css-loader' ]
      },
      {
        test: /\.styl$/,
        use: ['style-loader', 'css-loader', 'stylus-loader']
      },
    ]
  },    
  resolveLoader: {
    modules: ['node_modules', path.resolve(__dirname, 'src/loaders/')],
  },
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
};