
  module.exports = {
  runtimeCompiler: true,
  transpileDependencies: [
      'vuetify'
  ],
  devServer: {
      overlay: {
          warnings: false,
          errors: false
      }
  },
  lintOnSave: false,
  configureWebpack: {
    watchOptions: {
      poll: 5000,
      aggregateTimeout: 1000,
    }
  }
}
