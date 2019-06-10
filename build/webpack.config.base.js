const path = require('path');

module.exports = {
    entry: {
        promise: path.resolve(__dirname, '../src/promise.js')
    },

    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: '[name].js',
        publicPath: '/dist/'
    },

    module: {
        rules: [
            {
              test: /\.m?js$/,
              exclude: /(node_modules|bower_components)/,
              use: {
                loader: 'babel-loader'
              }
            }
        ]
    }
}