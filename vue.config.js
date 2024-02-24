const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  publicPath: 'https://admin.genieadmin.com/',
  transpileDependencies: true,
  pluginOptions: {
    vuetify: {}
  }
})