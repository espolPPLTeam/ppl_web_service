const soap = require('soap')
const cheerio = require('cheerio')
const path = require('path')
const fs = require('fs')
const sinon = require('sinon')
const chai    = require('chai')
const expect = require('chai').expect
const co = require('co')
const _ = require('lodash')
const jsonfile = require('jsonfile')
const chaiXml = require('chai-xml')
const Ajv = require('ajv')
const logger = require('tracer').console()
const ajv = new Ajv({$data: true})
const jsondiffpatch = require('jsondiffpatch').create({
  arrays: {
    detectMove: true,
    includeValueOnMove: true
  }
})

chai.use(chaiXml)

const WSPPL = require('./app')
const dump = require('./dump')
const config = require('./config')
const dumpFolder = path.join(__dirname, './dump')

const dbMock = {
  	crearEstudiante({ nombres, apellidos, correo, matricula }) { // null si no se creo o lo que sea?. Aqui se debe implementar cosas extras como ingresarlo a grupo
  	  return Promise.resolve({ nombres, apellidos, correo, matricula })
  	},
  	crearProfesor({ nombres, apellidos, correo, tipo }) {
  	  return Promise.resolve({ nombres, apellidos, correo, tipo })
  	},
  	crearParalelo({ codigoMateria, nombreMateria, paralelo}) {
      return Promise.resolve({ codigoMateria, nombreMateria, paralelo})
  	},
  	anadirEstudiantAParalelo({ paralelo: { curso, codigo }, estudianteIdentificador }) { // Aqui se debe implementar cosas extras como ingresarlo a grupo
      return Promise.resolve({ paralelo: { curso, codigo }, estudianteIdentificador })
  	},
  	anadirProfesorAParalelo({ paralelo: { curso, codigo }, profesorIdentificador }) {
  	  return Promise.resolve({ paralelo: { curso, codigo }, profesorIdentificador })
  	},
  	eliminarEstudiante({ estudianteIdentificador }) { // tiene que moverse de paralelo y vera que hace el que la implementa
      return Promise.resolve(true)
  	},
  	cambiarEstudianteParalelo({ paraleloNuevo ,estudianteIdentificador }) {
      return Promise.resolve(true)
  	},
    cambiarNombresEstudiante({ nombresNuevo, estudianteIdentificador}) {
      return Promise.resolve(true)
    },
    cambiarApellidosEstudiante({ nombresNuevo, estudianteIdentificador}) {
      return Promise.resolve(true)
    },
    cambiarCorreoEstudiante({ correoNuevo, estudianteIdentificador}) {
      return Promise.resolve(true)
    },
    paralelos({}) {
      return Promise.resolve(dump.paralelos[0])
    }
}

const db = dbMock
const wsPPL = WSPPL({ soap, cheerio, fs,  path, co, _, config, db, jsondiffpatch, logger })
// expect(ajv.validate(schema.PROFESOR_DATOS, res.body.datos)).to.equal(true)
describe('PPL WEB SERVICE', () =>  {
  before(function(done) {
    done()
  })
  it('@t1 OBTENER RAW ESTUDIANTES', (done) => {
  	let argumentosEstudiantes = {
  		anio: config.anioDesde,
		termino: config.termino.primer,
		paralelo: config.paraleloDesde,
		codigomateria: config.materiaCodigo.fisica2
  	}
  	let metodoEstudiantes = config.metodos.estudiantes
    wsPPL.obtenerRaw({ argumentos: argumentosEstudiantes, metodo: metodoEstudiantes }).then((resp) => {
      expect(resp).xml.to.be.valid()
      done()
    })
  }).timeout(20000)
  it('@t2 OBTENER RAW PROFESOR', (done) => {
  	let argumentosProfesores = {
      anio: config.anioDesde,
      termino: config.termino.primer,
      paralelo: config.paraleloDesde,
      codigomateria: config.materiaCodigo.fisica2,
      tipo: config.tiposProfesor.peer,
    }
    let metodoProfesores = config.metodos.profesores
    wsPPL.obtenerRaw({ argumentos: argumentosProfesores, metodo: metodoProfesores }).then((resp) => {
      expect(resp).xml.to.be.valid()
      done()
    })
  }).timeout(20000)
  describe('@t3 GENERAR JSON ESTUDIANTE', () =>  {
  	it('@t3.1 OK', (done) => {
  	  const estudiantesDump = dump.estudiantesWSDL.raw
  	  const cantidadEstudiantesDump = dump.estudiantesWSDL.cantidad
      const estudiantes = wsPPL.generarJsonEstudiante({ raw: estudiantesDump })
      expect(estudiantes).to.have.lengthOf(cantidadEstudiantesDump)
      expect(estudiantes).to.be.an('array')
      done()
  	}).timeout(20000)
  	it('@t3.2 VACIO', (done) => {
  	  const estudiantesDump = dump.estudiantesWSDL.vacio
  	  const vacio = 0
      const estudiantes = wsPPL.generarJsonEstudiante({ raw: estudiantesDump })
      expect(estudiantes).to.have.lengthOf(vacio)
      expect(estudiantes).to.be.an('array')
      done()
  	}).timeout(20000)
  })

  describe('@t4 GENERAR JSON PROFESOR', () =>  {
  	it('@t4.1 OK TITULAR', (done) => {
  	  const profesorDump = dump.profesorTitularWSDL.raw
      const profesor = wsPPL.generarJsonProfesor({ raw: profesorDump, tipo: 'titular' })
      expect(profesor).to.be.an('object')
      expect(profesor).to.have.a.property('nombres')
      expect(profesor).to.have.property('tipo', 'titular')
      done()
  	}).timeout(20000)
  	it('@t4.2 OK PEER', (done) => {
  	  const profesorDump = dump.profesorTitularWSDL.raw
      const profesor = wsPPL.generarJsonProfesor({ raw: profesorDump, tipo: 'peer' })
      expect(profesor).to.be.an('object')
      expect(profesor).to.have.a.property('nombres')
      expect(profesor).to.have.property('tipo', 'peer')
      done()
  	}).timeout(20000)
  	it('@t4.3 VACIO', (done) => {
  	  const profesorDump = dump.profesorTitularWSDL.vacio
      const profesor = wsPPL.generarJsonProfesor({ raw: profesorDump })
      expect(profesor).to.be.an('object')
      expect(profesor).to.be.empty
      done()
  	}).timeout(20000)
  })

  describe('@t5 LEER TODOS DE WS Y GENERAR JSON', () =>  {
  	it('@t5.1 OK ESTUDIANTES', (done) => {
  	  done()
  	})
  	it('@t5.1 OK PROFESORES', (done) => {
  	  done()
  	})
  })

  describe('@t6 GENERAR PARALELO', () =>  {
  	it('@t6.1 OK', (done) => {
  	  let estudiantes = dump.estudiantesJson[1]
  	  let paralelos = wsPPL.generarJsonParalelosTodos({ estudiantesJson: estudiantes })
  	  expect(paralelos).to.have.lengthOf(10)
  	  let paraleloPrueba = paralelos[0]
  	  expect(paraleloPrueba).to.have.property('codigoMateria')
  	  expect(paraleloPrueba).to.have.property('nombreMateria')
  	  expect(paraleloPrueba).to.have.property('paralelo')
  	  done()
  	})
  })

  describe('@t7 DATABASE', () =>  {
  	describe('@t7.1 PARALELO', () =>  {
  	  it('@t7.1.1 OK', (done) => {
  	  	let paralelosJson = dump.paralelos[0]
  	  	wsPPL.guardarParalelos({ paralelosJson }).then((estado) => {
  	      expect(estado).to.be.true
  	      done()
  	  	}).catch((err) => console.log(err))
  	  })
  	})
  	describe('@t7.2 ESTUDIANTES', () =>  {
  	  it('@t7.2.1 OK', (done) => {
  	  	let estudiantesJson = dump.estudiantesJson[0]
  	  	wsPPL.guardarEstudiantes({ estudiantesJson }).then((estado) => {
          expect(estado).to.be.true
  	      done()
  	  	}).catch((err) => console.log(err))
  	  })
  	})
    describe('@t7.3 PROFESOR', () =>  {
  	  it('@t7.3.1 OK', (done) => {
  	  	let profesoresJson = dump.profesoresJson[0]
  	  	wsPPL.guardarProfesores({ profesoresJson }).then((estado) => {
          expect(estado).to.be.true
  	      done()
  	  	}).catch((err) => console.log(err))
  	  })
  	})
    describe('@t7.4 ACTUALIZAR', () =>  {
      it('@t7.4.1 ESTUDIANTE CAMBIO PARALELO', (done) => {
        let estudiantesJsonWS = dump.estudiantesJson[0]
        let estudiantesJsonDB = JSON.parse(JSON.stringify(estudiantesJsonWS))
        // estudiantesJsonWS.splice(1,1)
        estudiantesJsonWS[0]['paralelo'] = '2'
        estudiantesJsonWS[0]['correo'] = 'joelerll@gmail.com'
        estudiantesJsonWS[1]['paralelo'] = '3'
        estudiantesJsonWS[3]['nombres'] = 'Joel'
        wsPPL.actualizarEstudiantes({ estudiantesWS: estudiantesJsonWS, estudiantesDB: estudiantesJsonDB }).then((resp) => {
          expect(resp).to.be.true
          done()
        })
      })
      it('@t7.4.2 ESTUDIANTE RETIRADO', (done) => {
        let estudiantesJsonWS = dump.estudiantesJson[0]
        let estudiantesJsonDB = JSON.parse(JSON.stringify(estudiantesJsonWS))
        estudiantesJsonWS.splice(1,1)
        wsPPL.actualizarEstudiantes({ estudiantesWS: estudiantesJsonWS, estudiantesDB: estudiantesJsonDB }).then((resp) => {
          expect(resp).to.be.true
          done()
        })
      })
      it('@t7.4.3 ESTUDIANTE NUEVO', (done) => {
        let estudiantesJsonWS = dump.estudiantesJson[0]
        let estudiantesJsonDB = JSON.parse(JSON.stringify(estudiantesJsonWS))
        estudiantesJsonDB.splice(1,1)
        wsPPL.actualizarEstudiantes({ estudiantesWS: estudiantesJsonWS, estudiantesDB: estudiantesJsonDB }).then((resp) => {
          expect(resp).to.be.true
          done()
        })
      })
      it('@t7.4.4 ESTUDIANTE CAMBIO CORREO', (done) => {

      })
      it('@t7.4.5 ESTUDIANTE CAMBIO NOMBRES', (done) => {

      })
      it('@t7.4.6 ESTUDIANTE CAMBIO APELLIDOS', (done) => {

      })
      it('@t7.4.7 CAMBIO PARALELO, ACTUALIZAR CORREO, NUEVOS, ELIMINADOS', (done) => {

      })
    })
  })

})
