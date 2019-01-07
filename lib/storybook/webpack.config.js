module.exports = (baseConfig, env, config) => {
  config.module.rules.push({
    test: /\.tsx?$/,
    use: [require.resolve('ts-loader'), require.resolve('react-docgen-typescript-loader')],
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
