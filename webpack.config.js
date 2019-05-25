const nodeExternals = require('webpack-node-externals');
module.exports = {
    mode: 'production',
    entry:  __dirname + "/src/main.js",
    output: {
        path: __dirname + "/",
        filename: "server.js",
        chunkFilename: "[name].chunk.js",
        libraryTarget: "commonjs"
    },
    externals: [
      nodeExternals()
    ],
    node: {
        fs: 'empty',
        child_process: 'empty',
        tls: 'empty',
        net: 'empty'
    },
    target: 'node'
};