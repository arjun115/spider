var express = require('express')
var path = require('path')

var app = express()
app.use('/', express.static(path.join(__dirname, 'public')))

console.log('Server listen on 3000 port')
app.listen(3000)