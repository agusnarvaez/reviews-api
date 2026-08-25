import app from './src/app.js'

app.listen(app.get('port'), '0.0.0.0', () => {
  console.log('Server on port http://localhost:' + app.get('port'))
})

export { app }
