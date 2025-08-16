module.exports = {
    apps: [
      {
        name: 'backend',
        script: 'src/index.js',
        env: {
            JWT_SECRET:"mySuperSecretKey123!",
            JWT_REFRESH_SECRET:"mySuperSecretKey123!",       
          NODE_ENV: 'production'
        }
      }
    ]
  }