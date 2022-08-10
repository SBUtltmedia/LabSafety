const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
   output: {
      filename: '[name].[hash].js'
   },
	plugins: [new CleanWebpackPlugin()],
};
