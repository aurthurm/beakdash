const path = require('path');

module.exports = {
  entry: './src/lib/DashboardWidgetSDK.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'dashboard-widget.min.js',
    library: 'DashboardWidget',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  }
};
