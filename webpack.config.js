path = require("path");
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
    entry: path.resolve(__dirname, "src", "index.js"),
    output: {
        filename: "bundle.js"
    },
    plugins: [
        new CompressionPlugin()
    ],
    watch: true
};