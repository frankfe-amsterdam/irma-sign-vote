const { merge } = require('webpack-merge');
const common = require('./webpack.common');
const webpack = require('webpack');
const path = require('path');

module.exports = () =>
    merge(common, {
        mode: 'development',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: '[name].js',
            publicPath: '/'
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify('development')
            })
        ],
        devServer: {
            historyApiFallback: true,
            clientLogLevel: 'silent',
            contentBase: path.join(__dirname, 'public'),
            watchContentBase: true,
            hot: true,
            inline: true,
            overlay: true
        },
        devtool: 'inline-source-map',
        performance: {
            hints: false
        }
    });
