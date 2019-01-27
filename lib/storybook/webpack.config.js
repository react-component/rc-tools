const tsConfig = require('../getTSCommonConfig');

module.exports = (baseConfig, env, config) => {
  config.module.rules.push({
    test: /\.tsx?$/,
    use: [
      {
        loader: require.resolve('ts-loader'),
        options: {
          configFile: tsConfig.getConfigFilePath(),
        },
      },
      require.resolve('react-docgen-typescript-loader'),
    ],
  });

  config.resolve.extensions.push('.ts', '.tsx');

  config.module.rules.push({
    test: /\.less$/,
    use: [
      {
        loader: 'style-loader',
      },
      {
        loader: 'css-loader',
      },
      {
        loader: 'less-loader',
        options: {
          strictMath: true,
          noIeCompat: true,
        },
      },
    ],
  });
  config.resolve.extensions.push('.less');
  return config;
};
