const fs = require('fs')
const path = require('path')
module.exports = {
  estudiantes: function() {
    return fs.readFileSync(path.join(__dirname, './estudiante__2017_1s_FISG1002_1.wsdl')).toString()
  },
  profesores: function() {
    return fs.readFileSync(path.join(__dirname, './profesor_2017_1s_FISG1002_1_0.wsdl')).toString()
  },
  vacio: function() {
    return fs.readFileSync(path.join(__dirname, './vacio.wsdl')).toString()
  }
}
