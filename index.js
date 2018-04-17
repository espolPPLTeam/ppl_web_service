const co = require('co')
const logger = require('./logger')
var CronJob = require('cron').CronJob
const WSPPL = require('./app')
const config = require('./config')
const dump = require('./dump')

module.exports = ({ db, anio, termino, cron, local }) => {
  if (config.termino.primer !== termino && config.termino.segundo !== termino ) {
    console.error('El termino debe ser 1s o 2s')
    process.exit(1)
  }
  const wsPPL = WSPPL({ config, db, logger })
  const TERMINO_ACTUAL = termino || config.terminoActual()
  const ANIO_ACTUAL = anio || config.anioActual
  const proto = {
    inicializar() {
      co(function* () {
        let estaLleno = yield db.estaLleno()
        let estudiantesJson = []
        let profesoresJson = []
        let paralelosJson = []
        if (!estaLleno) {
          if (local) {
            estudiantesJson = dump.estudiantesJson()[1]
            profesoresJson = dump.profesoresJson()[1]
            paralelosJson = wsPPL.anadirTerminoYAnio({ termino: TERMINO_ACTUAL, anio: ANIO_ACTUAL, json: dump.paralelos[0] })
          } else {
            estudiantesJson = yield wsPPL.generarJsonEstudiantesTodos({ termino: TERMINO_ACTUAL, anio: ANIO_ACTUAL })
            profesoresJson = yield wsPPL.generarJsonProfesoresTodos({ termino: TERMINO_ACTUAL, anio: ANIO_ACTUAL })
            paralelosJson = wsPPL.anadirTerminoYAnio({ termino: TERMINO_ACTUAL, anio: ANIO_ACTUAL, json: wsPPL.generarJsonParalelosTodos({ estudiantesJson }) })
          }
          const estaGuardadoParalelo = yield wsPPL.guardarParalelos({ paralelosJson })
          const estaGuardadoProfesor = yield wsPPL.guardarProfesores({ profesoresJson })
          const estaGuardadoEstudiante = yield wsPPL.guardarEstudiantes({ estudiantesJson })
          if (estaGuardadoParalelo && estaGuardadoProfesor && estaGuardadoEstudiante)
            logger.info('Fueron creados existosamente')
        } else {
          logger.info('La base de datos no esta vacia')
        }
      }).catch((err) => {
        logger.error(err)
      })
    },
    actualizar() {
      new CronJob(cron, function() {
        co(function* () {
          let estudiantesWS = []
          let estudiantesDB = yield db.obtenerTodosEstudiantes()
          if (local) {
            estudiantesWS = dump.estudiantesJson()[1]
          } else {
            estudiantesWS = yield wsPPL.generarJsonEstudiantesTodos({ termino: TERMINO_ACTUAL, anio: ANIO_ACTUAL })
          }
          let estudiantesWSLimpiados = estudiantesWS.map(function(estudiante) {
            return (({ nombres, apellidos, matricula, correo, paralelo, codigoMateria }) => ({ nombres, apellidos, matricula, correo, paralelo, codigoMateria }))(estudiante)
          }, [])
          let estudiantesDBLimpiados = estudiantesDB.map(function(estudiante) {
            return (({ nombres, apellidos, matricula, correo, paralelo, codigoMateria }) => ({ nombres, apellidos, matricula, correo, paralelo, codigoMateria }))(estudiante)
          }, [])
          const actualizado = yield wsPPL.actualizarEstudiantes({ estudiantesWS: estudiantesWSLimpiados, estudiantesDB: estudiantesDBLimpiados })
          if (actualizado) {
            logger.info('fue actualizado')
          } else {
            logger.info('no hubo cambios')
          }
        })
   	  }, null, true, 'America/Los_Angeles')
    }
  }
  return Object.assign(Object.create(proto), {})
}
