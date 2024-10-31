const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  publicPath: process.env.NODE_ENV === 'production' ? 'https://admin.genieadmin.com/' : '',
  transpileDependencies: true,
  pluginOptions: {
    vuetify: {}
  }
})