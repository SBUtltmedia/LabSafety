const SystemBellPlugin = require('system-bell-webpack-plugin');

module.exports = {
	output: {
		filename: '[name].js',
	},
	devServer: {
		compress: false,
		open: 'chrome',
		stats: 'errors-only',
		overlay: true,
	},
	plugins: [new SystemBellPlugin()],
};
