var webpack = require('webpack');

var join = require('path').join;

var include = join(__dirname, 'src');

module.exports = {
    entry: './src/index',
    output: {
        path: join(__dirname, 'dist'),
        libraryTarget: 'umd',
        library: 'manhattan',
    },
    // devtool: 'source-map',
    module: {
        loaders: [
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        })
    ]
};