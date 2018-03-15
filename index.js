const soap = require('soap')
const cheerio = require('cheerio')
const path = require('path')
const fs = require('fs')
const co = require('co')
const _ = require('lodash')
const WSPPL = require('./app')
const config = require('./config')
const ajv = new Ajv({$data: true})
const jsondiffpatch = require('jsondiffpatch').create({
  arrays: {
    detectMove: true,
    includeValueOnMove: true
  }
})

module.exports = ({ db, anio, termino, profesoresBase }) => {
  // expect(ajv.validate(schema.PROFESOR_DATOS, res.body.datos)).to.equal(true)
  // verificar que profesoresBase sea valido
  // verificar que termino sea valido
  // verifivar que anio sea valido
  // verificar que db tenga las propiedades basicas y que retornen todos promises
  const wsPPL = WSPPL({ soap, cheerio, fs,  path, co, _, config, db, jsondiffpatch })
  const TERMINO_ACTUAL = termino || config.terminoActual()
  const ANIO_ACTUAL = anio || config.anioActual
  const proto = {
    inicializar() {
      co(function* () {
        const estudiantesJson = yield wsPPL.generarJsonEstudiantesTodos({ termino: TERMINO_ACTUAL, anio: ANIO_ACTUAL })
        const profesoresJson = yield wsPPL.generarJsonProfesoresTodos({ termino: TERMINO_ACTUAL, anio: ANIO_ACTUAL })
        const paralelosJson = anadirTerminoYAnio({ termino: TERMINO_ACTUAL, anio: ANIO_ACTUAL, json: wsPPL.generarJsonParalelosTodos({ estudiantesJson }) }
        const estaGuardadoParalelo = yield wsPPL.guardarParalelos({ paralelosJson })

        const estaGuardadoProfesor = yield wsPPL.guardarProfesores({ profesoresJson })
        const estaGuardadoEstudiante = yield wsPPL.guardarEstudiantes({ estudiantesJson })
        if (estaGuardadoParalelo && estaGuardadoProfesor && estaGuardadoEstudiante)
          console.log('Fueron creados existosamente')
      }).catch((err) => {
        console.log(err)
      })
    },
    actualizar() {

    }
  }
  return Object.assign(Object.create(proto), {})
}
// {
//   anio: //opcional
//   termino: // opcional,
//   cron: { // opcional
//     inicio
//     fin
//     horaCorrer
//     intervalo
//   }
//   db: { // todos son promises y oblitorios, documentar que recibe y que tiene que devolver
//     obtenerEstudiantesDB //
//     obtenerProfesoresDB //
//     crearEstudiante
//     crearProfesor
//     crearParalelo
//     anadirEstudiantAParalelo
//     anadirProfesorAParalelo
//     eliminarEstudiante
//     cambiarEstudianteParalelo
//   },
//   profesoresJson: // profesor que se quieren anadir y que pueden estar tambie en la base de datos, documentar formato
// }
