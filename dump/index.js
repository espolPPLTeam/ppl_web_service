const fs = require('fs')
const path = require('path')
const jsonfile = require('jsonfile')
module.exports = {
  estudiantesWSDL: {
    raw: fs.readFileSync(path.join(__dirname, './estudiantes.wsdl')).toString(),
    cantidad: 118,
    vacio: fs.readFileSync(path.join(__dirname, './estudiantes_vacio.wsdl')).toString()
  },
  profesorTitularWSDL: {
    raw: fs.readFileSync(path.join(__dirname, './profesor_titular.wsdl')).toString(),
    vacio: fs.readFileSync(path.join(__dirname, './profesores_vacio.wsdl')).toString()
  },
  profesorPeerWSDL: {
    raw: fs.readFileSync(path.join(__dirname, './profesor_peer.wsdl')).toString()
  },
  estudiantesJson: [
    jsonfile.readFileSync(path.join(__dirname, './estudiantes_2017_1s.json')),
    jsonfile.readFileSync(path.join(__dirname, './estudiantes_2017_2s.json'))
  ],
  profesoresJson: [
    jsonfile.readFileSync(path.join(__dirname, './profesores_2017_1s.json')),
    jsonfile.readFileSync(path.join(__dirname, './profesores_2017_2s.json'))
  ],
  paralelos: [
    jsonfile.readFileSync(path.join(__dirname, './paralelos_2017_2s.json'))
  ],
  profesoresJsonBase: jsonfile.readFileSync(path.join(__dirname, './profesores.json'))
}
