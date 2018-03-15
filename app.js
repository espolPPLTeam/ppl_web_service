module.exports = ({ soap, cheerio, co, fs, path, config, db, _, jsondiffpatch }) => {
  const _url_ = config.url
  const _soap_ = soap
  const _cheerio_ = cheerio
  const _fs_ = fs
  const _path_ = path
  const _config_ = config
  const _co_ = co
  const paralelos = []
  const proto = {
    generarJsonEstudiantesTodos({ termino, anio }) {
      const self = this
      const materias = Object.keys(_config_.materiaCodigo).map((k) => _config_.materiaCodigo[k])
      const terminoActual = termino || _config_.terminoActual()
      const anioActual = anio || _config_.anioActual
      return new Promise((resolve, reject) => {
        _co_(function *() {
          let paralelo = _config_.paraleloDesde
          let exitenEstudiantes = true
          let estudiantesTodos  = []
          for (let i = 0; i < materias.length; i++) {
            let codigomateria = materias[i]
            do { // pedir los paralelos mientras no esten vacios
              let argumentosEstudiantes = {
                anio: anioActual,
                termino: terminoActual,
                paralelo,
                codigomateria
              }
              let raw =  yield self.obtenerRaw({ argumentos: argumentosEstudiantes, metodo: config.metodos.estudiantes })
              let estudiantesJson = self.generarJsonEstudiante({ raw })
              exitenEstudiantes = estudiantesJson.length ? true : false
              if (exitenEstudiantes) {
                estudiantesTodos = [...estudiantesTodos, ...estudiantesJson] // anadir estudiantes
              }
              paralelo++ // aumentar el numero del paralelo
            } while (exitenEstudiantes)
            paralelo = 1
          }
          resolve(estudiantesTodos)
        }).catch((err) => console.log(err))
      })
    },
    generarJsonProfesoresTodos({ termino, anio }) {
      // tambien tiene que leer datos de un json predeterminado
      const self = this
      return new Promise((resolve, reject) => {
        _co_(function *() {
          const materias = Object.keys(_config_.materiaCodigo).map((k) => _config_.materiaCodigo[k])
          const terminoActual = termino || _config_.terminoActual()
          const anioActual = anio || _config_.anioActual
          let profesoresTodos  = []
          for (let i = 0; i < materias.length; i++) {
            let paralelo = _config_.paraleloDesde
            let codigomateria = materias[i]
            let profesoresJson = []
            while (true) {  // buscar por cada paralelo
              const tiposProfesores = Object.keys(_config_.tiposProfesor).map((k) => _config_.tiposProfesor[k])
              for (let j = 0; j < tiposProfesores.length; j++) { // buscar por cada tipo ['peer', 'titular']
                let tipo = tiposProfesores[j]
                let argumentosProfesores = {
                  anio: anioActual,
                  termino: terminoActual,
                  paralelo,
                  codigomateria,
                  tipo,
                }
                let raw =  yield self.obtenerRaw({ argumentos: argumentosProfesores, metodo: config.metodos.profesores })
                profesoresJson = self.generarJsonProfesor({ raw, tipo: _config_.tipoProfesor({ tipo }) })
                let estaVacio = !_.isEmpty(profesoresJson)
                if (estaVacio) {
                  profesoresTodos.push(profesoresJson) // anadir profesores
                }
              }
              if (_.isEmpty(profesoresJson)) {
                break
              }
              paralelo++ // aumentar el numero del paralelo
            }
          }
          resolve(profesoresTodos)
        })
      })
    },
    obtenerRaw({ argumentos, metodo }) {
      if ( !argumentos || ! metodo)
        reject('No envia parametro: argumentos, metodo')
      return new Promise((resolve, reject) => {
        _soap_.createClient(_url_, function(err, client) {
          client[metodo](argumentos, function(err, result, raw) {
            if (err) reject(err)
            resolve(raw)
          })
        })
      })
    },
    generarJsonParalelosTodos({ estudiantesJson }) {
      let paralelos = _.uniqBy(estudiantesJson, (e) => {
        return [e.paralelo, e.codigoMateria].join()
      })
      let paralelosLimpiados = paralelos.map(function(paralelo) {
        return (({ codigoMateria, nombreMateria, paralelo }) => ({ codigoMateria, nombreMateria, paralelo }))(paralelo)
      }, [])
      return paralelosLimpiados
    },
    generarJsonEstudiante({ raw }) {
      // devuelve array vacio si ya no hay datos
      // errores: comprobar que todos generen el json con todos los datos, si no escibir en un logger
      //          compronar que todos tengan correo espol
      if ( !raw )
        reject('No envia parametro: raw')
      let estudiantesDatos = []
      let load = _cheerio_.load(raw)
      load('Estudiantes').each(function(index, elem) {
        let $ = _cheerio_.load(load.html(load(this)))
        estudiantesDatos.push(estudiante = {
          nombres: $('NOMBRES').text().trim(),
          apellidos: $('APELLIDOS').text().trim(),
          matricula: $('COD_ESTUDIANTE').text().trim(),
          correo: $('EMAIL').text().trim(),
          // datos paralelo
          paralelo: $('PARALELO').text().trim(),
          codigoMateria: $('COD_MATERIA_ACAD').text().trim(),
          nombreMateria: $('NOMBRE').text().trim()
        })
      })
      return estudiantesDatos
    },
    generarJsonProfesor({ raw, tipo }) {
      // si no tiene nada devuelve {}
      if ( !raw )
        reject('No envia parametro: raw')
      let $ = _cheerio_.load(raw)
      let profesorDatos = {
        nombres: $('NOMBRES').text().trim(),
        apellidos: $('APELLIDOS').text().trim(),
        correo: $('EMAIL').text().trim(),
        tipo,
        // datos paralelo
        paralelo: $('PARALELO').text().trim(),
        codigoMateria: $('CODIGOMATERIA').text().trim(),
        nombreMateria: $('NOMBRE').text().trim()
      }
      return profesorDatos['correo'] ? profesorDatos : {}
    },
    anadirTerminoYAnio({ termino, anio, json }) {
      let datosAnadidos = json.map((obj) => {
        obj.termino = termino
        obj.anio = anio
        return obj
      })
      return datosAnadidos
    },
    guardarParalelos({ paralelosJson }) {
      const cantidaParalelos = paralelosJson.length
      return new Promise((resolve, reject) => {
        co(function *() {
          for (var i = 0; i < cantidaParalelos ; i++) {
            let { codigoMateria, nombreMateria, paralelo, termino, anio } = paralelosJson[i]
            let estado = yield db.crearParalelo({ codigoMateria, nombreMateria, paralelo, termino, anio })
            if (!estado) {
              // logger de errores
            }
          }
          resolve(true)
        }).catch((err) => {
          reject(err)
        })
      })
    },
    guardarProfesores({ profesoresJson }) {
      const cantidaProfesores = profesoresJson.length
      return new Promise((resolve, reject) => {
        co(function *() {
          for (var i = 0; i < cantidaProfesores ; i++) {
            let { nombres, apellidos, correo, tipo, paralelo, codigoMateria } = profesoresJson[i]
            let estado = yield db.crearProfesor({ nombres, apellidos, correo, tipo })
            let estadoParalelo = yield db.anadirProfesorAParalelo({ paralelo: { curso: paralelo, codigo: codigoMateria }, profesorIdentificador: correo })
            if (!estado || !estadoParalelo) {
              // logger de errores
            }
          }
          resolve(true)
        }).catch((err) => {
          reject(err)
        })
      })
    },
    guardarEstudiantes({ estudiantesJson }) {
      const cantidadEstudiantes = estudiantesJson.length
      return new Promise((resolve, reject) => {
        co(function *() {
          for (var i = 0; i < cantidadEstudiantes ; i++) {
            let { nombres, apellidos, correo, matricula, paralelo, codigoMateria } = estudiantesJson[i]
            let estado = yield db.crearEstudiante({ nombres, apellidos, correo, matricula })
            let estadoParalelo = yield db.anadirEstudiantAParalelo({ paralelo: { curso: paralelo, codigo: codigoMateria }, estudianteIdentificador: correo })
            if (!estado || !estadoParalelo) {
              // logger de errores
            }
          }
          resolve(true)
        }).catch((err) => {
          reject(err)
        })
      })
    },

    // actualizaciones
    actualizarEstudiantes({ estudiantesWS, estudiantesDB }) {
      const self = this
      return new Promise((resolve, reject) => {
        const estudiantesWSOrdenados = _.sortBy(estudiantesWS, ['nombres'])
        const estudiantesDBOrdenados = _.sortBy(estudiantesDB, ['nombres'])
        const hayDiferencias = jsondiffpatch.diff(estudiantesDBOrdenados, estudiantesWSOrdenados)
        if (hayDiferencias) {
          const estudiantesEliminados = _.differenceWith(estudiantesDB, estudiantesWS, _.isEqual)
          const estudiantesNuevos = _.differenceWith(estudiantesWS, estudiantesDB, _.isEqual)
          const estudiantesEditados =  _.intersectionBy(estudiantesEliminados, estudiantesNuevos, 'matricula')
          const estudiantesEliminadosDB = _.differenceBy(estudiantesEliminados, estudiantesEditados, 'matricula')
          const estudiantesNuevosWS = _.differenceBy(estudiantesNuevos, estudiantesEditados, 'matricula')
          const hayEstudiantesEditados = !_.isEmpty(estudiantesEditados)
          const hayEstudiantesEliminados = !_.isEmpty(estudiantesEliminadosDB)
          const hayEstudiantesNuevos = !_.isEmpty(estudiantesNuevosWS)
          co(function *() {
            if (hayEstudiantesEditados) { // cambiado paralelo, cambiado datos estudiante
              const estudiantesDBEditados = estudiantesDB.filter(est => {
                for (let i = 0; i < estudiantesEditados.length; i++) {
                  if (self.estudiantesIguales(estudiantesEditados[i], est)) {
                    return estudiantesEditados[i]
                  }
                }
              })
              const estudiantesWSEditados = estudiantesWS.filter(est => {
                for (let i = 0; i < estudiantesEditados.length; i++) {
                  if (self.estudiantesIguales(estudiantesEditados[i], est)) {
                    return estudiantesEditados[i]
                  }
                }
              })
              const diferencias = jsondiffpatch.diff(estudiantesDBEditados, estudiantesWSEditados)
              console.log(estudiantesEditados)
              console.log(diferencias)
              if (diferencias)
                yield actualizarEstudiantesEditados({ diferencias, estudiantesEditados })
            }
            if (hayEstudiantesEliminados) {
              yield self.actualizarEstudiantesRetirados({ estudiantesEliminadosDB })
            }
            if (hayEstudiantesNuevos) {
              yield self.actualizarEstudiantesAnadidos({ estudiantesNuevosWS })
            }
            resolve(true)
          }).catch((err) => {
            console.error(err)
            // TODO: logger error
          })
        } else {
          // TODO: logger
          reject(false)
        }
      })
    },
    actualizarEstudiantesRetirados({ estudiantesEliminadosDB }) {
      return new Promise((resolve) => {
        co(function *() {
          let cantidadEstudiantesEliminados = estudiantesEliminadosDB.length
          for (let i = 0; i < cantidadEstudiantesEliminados; i++) {
            let estudiante = estudiantesEliminadosDB[i]
            let estudianteIdentificador = estudiante['matricula']
            let fueHecho = yield db.eliminarEstudiante({ estudianteIdentificador })
            if (!fueHecho) {
              // TODO: logger error
              console.error(new Error('Error en eliminar'))
            }
          }
          resolve(true)
        }).catch((err) => {
          console.error(err)
          // TODO: logger error
        })
      })
    },
    actualizarEstudiantesAnadidos({ estudiantesNuevosWS }) {
      return new Promise((resolve) => {
        co(function *() {
          let cantidadEstudiantesNuevos = estudiantesNuevosWS.length
          for (let i = 0; i < cantidadEstudiantesNuevos; i++) {
            let estudiante = estudiantesNuevosWS[i]
            let estudianteIdentificador = estudiante['matricula']
            let { nombres, apellidos, correo, matricula } = estudiante
            let fueCreado = yield db.crearEstudiante({ nombres, apellidos, correo, matricula })
            let { paralelo, codigoMateria } = estudiante
            let fueAnadidoAParalelo = yield db.anadirEstudiantAParalelo({ paralelo: { curso: paralelo, codigo: codigoMateria }, estudianteIdentificador: correo })
            if (!fueCreado || !fueAnadidoAParalelo) {
              // TODO: logger error
              console.error(new Error('Error en crear'))
            }
          }
          resolve(true)
        }).catch((err) => {
          console.error(err)
          // TODO: logger error
        })
      })
    },
    actualizarEstudiantesEditados({ diferencias, estudiantesEditados }) {
      return new Promise((resolve, reject) => {
        var indexes = Object.keys(diferencias)
        var estudiantes_cambiados_paralelo = []
        var estudiantes_cambiados_correo = []
        var estudiantes_cambiados_nombres = []
        var estudiantes_cambiados_apellidos = []
        for (var i = 0; i < (indexes.length - 1); i++) {
          let estudiante_camb = estudiantesDB[indexes[i]]
          if (diferencias[indexes[i]].paralelo) {
            estudiante_camb.paralelo_nuevo = diferencias[indexes[i]].paralelo[1]
            estudiantes_cambiados_paralelo.push(estudiante_camb)
          }
          if (diferencias[indexes[i]].correo) {
            estudiante_camb.correo_nuevo = diferencias[indexes[i]].correo[1]
            estudiantes_cambiados_correo.push(estudiante_camb)
          }
          if (diferencias[indexes[i]].nombres) {
            estudiante_camb.nombres_nuevo = diferencias[indexes[i]].nombres[1]
            estudiantes_cambiados_nombres.push(estudiante_camb)
          }
          if (diferencias[indexes[i]].apellidos) {
            estudiante_camb.apellidos_nuevo = diferencias[indexes[i]].apellidos[1]
            estudiantes_cambiados_apellidos.push(estudiante_camb)
          }
        }
        logger.log('cambiado paralelo',estudiantes_cambiados_paralelo.length)
        logger.log('cambiado apellidos', estudiantes_cambiados_apellidos.length)
        logger.log('cambiando nombres', estudiantes_cambiados_nombres.length)
        logger.log('cambiando correo', estudiantes_cambiados_correo.length)
        co(function* () {
          var paralelos = yield obtenerTodosParalelos()
          // paralelo
          for (var i = 0; i < estudiantes_cambiados_paralelo.length; i++) {
            var est = estudiantes_cambiados_paralelo[i]
            var estudiante = yield obtenerEstudiantePorMatricula(est.matricula)
            var paralelo = encontrarParalelo(est.paralelo, est.codigomateria, est.anio, est.termino, paralelos)
            var paralelo_nuevo = encontrarParalelo(est.paralelo_nuevo, est.codigomateria, est.anio, est.termino, paralelos)
            var logrado = yield cambiarEstudianteDeParalelo(paralelo._id, paralelo_nuevo._id, estudiante._id)
            var eliminado_grupo = yield eliminarEstudianteDeGrupos(estudiante._id)
            if (!logrado) {
              logger.error('no se pudo cambiar estado estudiante')
              return reject(false)
            }
          }
          // correo
          for (var i = 0; i < estudiantes_cambiados_correo.length; i++) {
            var est = estudiantes_cambiados_correo[i]
            // var estudiante = yield obtenerEstudiantePorMatricula(est.matricula)
            var match_correo = yield editarCorreo(est.matricula, est.correo_nuevo)
            if (!match_correo) {
              logger.error('no se pudo cambiar correo estudiante')
              return reject(false)
            }
          }
          // nombres
          for (var i = 0; i < estudiantes_cambiados_nombres.length; i++) {
            var est = estudiantes_cambiados_nombres[i]
            // var estudiante = yield obtenerEstudiantePorMatricula(est.matricula)
            var match_nombres = yield editarNombres(est.matricula, est.nombres_nuevo)
            if (!match_nombres) {
              logger.error('no se pudo cambiar correo estudiante')
              return reject(false)
            }
          }
          // apellidos
          for (var i = 0; i < estudiantes_cambiados_apellidos.length; i++) {
            var est = estudiantes_cambiados_apellidos[i]
            // var estudiante = yield obtenerEstudiantePorMatricula(est.matricula)
            var match_apellidos = yield editarApellidos(est.matricula, est.apellidos_nuevo)
            if (!match_apellidos) {
              logger.error('no se pudo cambiar correo estudiante')
              return reject(false)
            }
          }
          return resolve(true)
        }).catch(fail => console.log(fail))
      })
    },
    actualizarEstudiantesCambiadosCurso({}) {

    },
    actualizarEstudiantesCambiadoCorreo({}) {

    },
    actualizarEstudiantesCambiadoNombres({}) {

    },
    actualizarEstudiantesCambiadoApellidos({}) {

    },
    // cambio de paralelo
    // retirado
    actualizarProfesores({ profesoresWS, profesoresDB }) {

    },
    // agregar uno nuevo
    // eliminar uno
    actualizarParalelo({ paralelosWS, paralelosDB }) {

    },
    // helpers
    estudiantesIguales(estudiante1, estudiante2) {
      var iguales = estudiante1.matricula === estudiante2.matricula
      if (iguales)
        return true
      return false
    }
  }
  return Object.assign(Object.create(proto), {})
}
