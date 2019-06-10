const baseConfig = require('./webpack.config.base');
const webpack = require('webpack');

module.exports = Object.assign(baseConfig, {
    mode: 'development',
    devtool: 'inline-source-map',
    plugins: [
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin()
    ]
})