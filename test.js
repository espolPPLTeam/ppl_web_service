const soap = require('soap')
const cheerio = require('cheerio')
const path = require('path')
const fs = require('fs')
const sinon = require('sinon')
const expect = require('chai').expect

const WSPPL = require('./app')
const dump = require('./dump')

const url = 'https://ws.espol.edu.ec/saac/wsPPL.asmx?WSDL'
const metodoEstudiantes = 'wsConsultaEstudiantes'
const metodoProfesores = 'wsConsultaProfesores'
const argumentosEstudiantes = {
  anio: '2017',
  termino: '1s',
  codigomateria: 'FISG1002',
  paralelo: '1'
}
const argumentosProfesores = {
  anio: '2017', // 2017....
  termino: '1s', // [1s,2s]
  codigomateria: 'FISG1002', // ['FISG1002', 'FISG1003', 'FISG2001']
  paralelo: '2', // 1...
  tipo: '1' // [0,1]
}

const wsPPL = WSPPL({ url, soap, cheerio, fs,  path })

let estudiantesDump = dump.estudiantes()
let profesorDump = dump.profesores()
// wsPPL.obtenerRaw({ argumentos: argumentosProfesores, metodo: metodoProfesores }).then((raw) => {
//   wsPPL.generarJsonEstudiante({ raw: raw.toString() }).then((resp) => {
//     if (resp.length !== 0) {
//       let valido = wsPPL.saveFile({ tipo: 'profesor', argumentos: argumentosProfesores, raw })
//       console.log(valido)
//     }
//   })
// })

// console.log(estudiantesDump.toString())
let estudiantes = wsPPL.generarJsonEstudiante({ raw: estudiantesDump })
// console.log(estudiantes)
let profesor = wsPPL.generarJsonProfesor({ raw: profesorDump })
console.log(profesor)
// .then((resp) => {
//   let anadidos = wsPPL.anadirTerminoYAnio({ datos: resp, argumentos: argumentosEstudiantes })
//   console.log(anadidos)
// })

// wsPPL.obtenerEstudiantes({ argumentos: argumentosEstudiantes, metodo: metodoEstudiantes })
//   .then(wsPPL.generarJsonEstudiante)
//   .then((resp) => {
//     console.log (resp)
//   })

// describe('PPL WES SERVICE', () =>  {
//   it('@t1 OBTENER RAW', (done) => {
//     done()
//     // wsPPL.obtenerRaw({ argumentos: argumentosEstudiantes, metodo: metodoEstudiantes }).then((resp) => {
//     //   console.log(resp)
//     // })
//   })
// })
