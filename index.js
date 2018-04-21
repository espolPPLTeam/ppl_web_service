const co = require('co')
const logger = require('./logger')
const WSPPL = require('./app')
const config = require('./config')

module.exports = ({ db, anio, termino, local, dump }) => {
	const TERMINO_ACTUAL = termino || config.terminoActual()
  const ANIO_ACTUAL = anio || config.anioActual
  if (config.termino.primer !== TERMINO_ACTUAL && config.termino.segundo !== TERMINO_ACTUAL ) {
    console.error('El termino debe ser 1s o 2s')
    process.exit(1)
  }
  const wsPPL = WSPPL({ config, db, logger })
  const proto = {
    async inicializar() {
      let estaLleno = await db.estaLleno()
      let estudiantesJson = []
      let profesoresJson = []
      let paralelosJson = []
      if (!estaLleno) {
        if (local) {
          estudiantesJson = dump.estudiantesJson()[1]
          profesoresJson = dump.profesoresJson()[1]
          paralelosJson = wsPPL.anadirTerminoYAnio({ termino: TERMINO_ACTUAL, anio: ANIO_ACTUAL, json: dump.paralelos[0] })
        } else {
          estudiantesJson = await wsPPL.generarJsonEstudiantesTodos({ termino: TERMINO_ACTUAL, anio: ANIO_ACTUAL })
          profesoresJson = await wsPPL.generarJsonProfesoresTodos({ termino: TERMINO_ACTUAL, anio: ANIO_ACTUAL })
          paralelosJson = wsPPL.anadirTerminoYAnio({ termino: TERMINO_ACTUAL, anio: ANIO_ACTUAL, json: wsPPL.generarJsonParalelosTodos({ estudiantesJson }) })
        }
        const estaGuardadoParalelo = await wsPPL.guardarParalelos({ paralelosJson })
        const estaGuardadoProfesor = await wsPPL.guardarProfesores({ profesoresJson })
        const estaGuardadoEstudiante = await wsPPL.guardarEstudiantes({ estudiantesJson })
        if (estaGuardadoParalelo && estaGuardadoProfesor && estaGuardadoEstudiante) {
        	logger.info('Fueron creados existosamente')
        	return true
        } else {
        	logger.info('error')
        }
      } else {
      	logger.info('La base de datos no esta vacia')
      	return false
      }
    },
    actualizar() {
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
    }
  }
  return Object.assign(Object.create(proto), {})
}
