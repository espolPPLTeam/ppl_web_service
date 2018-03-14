const soap = require('soap')
const cheerio = require('cheerio')
const path = require('path')
const fs = require('fs')
const sinon = require('sinon')
const expect = require('chai').expect
const co = require('co')
const _ = require('lodash')
// const Datastore = require('nedb')
// let Estudiantes = new Datastore({ filename: path.join(__dirname, 'dump/estudiantes.db'), autoload: true })
// let Profesores = new Datastore({ filename: path.join(__dirname, 'dump/profesores.db'), autoload: true })
// let Paralelos = new Datastore({ filename: path.join(__dirname, 'dump/paralelos.db'), autoload: true })
// const db = {
//   Estudiantes,
//   Profesores,
//   Paralelos
// }

const WSPPL = require('./app')
const dump = require('./dump')
const config = require('./config')

const wsPPL = WSPPL({ soap, cheerio, fs,  path, co, _, config })

wsPPL.generarJsonProfesoresTodos({}).then((res) => {
  console.log(res)
})

// describe('PPL WES SERVICE', () =>  {
//   let estudiantesDump = dump.estudiantes()
//   let profesorDump = dump.profesores()
//   const argumentosEstudiantes = { anio: '2017', termino: '1s', codigomateria: 'FISG1002', paralelo: '1' }
//   const argumentosProfesores = { anio: '2017', termino: '1s', codigomateria: 'FISG1002', paralelo: '2', tipo: '1' }
//   before(function(done) {
//     db.Estudiantes.loadDatabase()
//     db.Profesores.loadDatabase()
//     db.Paralelos.loadDatabase()
//     done()
//   })
//   it('@t1 OBTENER RAW ESTUDIANTES', (done) => {
//     wsPPL.obtenerRaw({ argumentos: metodoEstudiantes, metodo: metodoEstudiantes }).then((resp) => {
//       done()
//     })
//   }).timeout(20000),
//   it('@t2 OBTENER RAW PROFESOR', (done) => {
//     wsPPL.obtenerRaw({ argumentos: argumentosProfesores, metodo: metodoProfesores }).then((resp) => {
//       done()
//     })
//   }).timeout(20000),
//   it('@t3 GENERAR JSON ESTUDIANTE', (done) => {
//     let estudiantes = wsPPL.generarJsonEstudiante({ raw: estudiantesDump })
//     done()
//   }),
//   it('@t4 GENERAR JSON PROFESOR', (done) => {
//     let profesor = wsPPL.generarJsonProfesor({ raw: profesorDump })
//     done()
//   }),
//   it('@t5 PARALELOS JSON', (done) => {
//     let estudiantes = wsPPL.generarJsonEstudiante({ raw: estudiantesDump })
//     done()
//   }),
//   it('@t6 ESTUDIANTES JSON', (done) => {
//     let estudiantes = wsPPL.generarJsonEstudiante({ raw: estudiantesDump })
//     done()
//   }),
//   it('@t7 PROFESORES JSON', (done) => {
//     let estudiantes = wsPPL.generarJsonEstudiante({ raw: estudiantesDump })
//     done()
//   })
//   // crear interface base de datos: que parametros envio, que espero recibir. Errors de esto
//   // crear paralelo
//   // crear estudiante
//   // crear profesor
//   // buscar estudiante
//   // buscar profesor
//   // buscar paralelo
//   // anadir estudiante a paralelo
//   // anadir profesor a paralelo
//   // buscar estudiante en paralelo
//   // buscar profesor en paralelo
//   describe('@t8 DATABASE', () =>  {
//     it('@t8.1 CREAR PARALELOS', (done) => {
//       done()
//     }),
//     it('@t8.2 CREAR ESTUDIANTES Y ANADIR A _____', (done) => {
//       done()
//     }),
//     it('@t8.3 CREAR PROFESORES  Y ANADIR A _____', (done) => {
//       done()
//     })
//   })
// })
