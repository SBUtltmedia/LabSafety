module.exports = {
    mode: 'development',
    context: __dirname,
    entry: './src/index.ts',
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: 'source-map-loader'
            },
            {
                test: /\.ts$/,
                use: 'ts-loader'
            }
        ]
    }
};