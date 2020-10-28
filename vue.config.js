  module.exports = {
  publicPath: '/physical-table/',
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
  }
}
