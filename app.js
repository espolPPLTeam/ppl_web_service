module.exports = ({ soap, cheerio, co, fs, path, config, db, _, jsondiffpatch, logger }) => {
  const URL = config.url
  const MATERIAS = Object.keys(config.materiaCodigo).map((k) => config.materiaCodigo[k])
  const proto = {
    /**
      * @promise
      * Devuelve todos los estudiantes de todos los paralelos.
      * @param {string} termino - puede ser 1s o 2s
      * @param {string} anio
      * @resolve {array}
    */
    generarJsonEstudiantesTodos({ termino, anio }) {
      const self = this
      const TERMINO_ACTUAL = termino || config.terminoActual()
      const ANIO_ACTUAL = anio || config.anioActual
      return new Promise((resolve, reject) => {
        co(function *() {
          let exitenEstudiantes = true
          let estudiantesTodos  = []
          let cantidadMaterias = MATERIAS.length
          for (let i = 0; i < cantidadMaterias; i++) { // buscar por cada materia existente
            let paralelo = config.paraleloDesde
            let codigomateria = MATERIAS[i]
            do { // pedir los paralelos mientras no esten vacios
              let argumentosEstudiantes = {
                anio: ANIO_ACTUAL,
                termino: TERMINO_ACTUAL,
                paralelo,
                codigomateria
              }
              let raw =  yield self.obtenerRaw({ argumentos: argumentosEstudiantes, metodo: config.metodos.estudiantes })
              let estudiantesJson = self.generarJsonEstudiante({ raw })
              exitenEstudiantes = estudiantesJson.length ? true : false
              if (exitenEstudiantes) {
                estudiantesTodos = [...estudiantesTodos, ...estudiantesJson]
              }
              paralelo++
            } while (exitenEstudiantes)
          }
          resolve(estudiantesTodos)
        }).catch((err) => {
          logger.error('generarJsonEstudiantesTodos', err)
          reject(err)
        })
      })
    },
    /**
      * @promise
      * Devuelve todos los profesores de todos los paralelos.
      * @param {string} termino - puede ser 1s o 2s
      * @param {string} anio
      * @returns {array}
    */
    generarJsonProfesoresTodos({ termino, anio }) {
      // TODO: cambiarlo a do while
      const self = this
      const TERMINO_ACTUAL = termino || config.terminoActual()
      const ANIO_ACTUAL = anio || config.anioActual
      return new Promise((resolve, reject) => {
        co(function *() {
          let profesoresTodos  = []
          for (let i = 0; i < MATERIAS.length; i++) { // por cada materia
            let paralelo = config.paraleloDesde
            let codigomateria = MATERIAS[i]
            let profesoresJson = []
            while (true) {  // buscar por cada paralelo
              const tiposProfesores = Object.keys(config.tiposProfesor).map((k) => config.tiposProfesor[k])
              for (let j = 0; j < tiposProfesores.length; j++) { // buscar por cada tipo ['peer', 'titular']
                let tipo = tiposProfesores[j]
                let argumentosProfesores = {
                  anio: ANIO_ACTUAL,
                  termino: TERMINO_ACTUAL,
                  paralelo,
                  codigomateria,
                  tipo,
                }
                let raw =  yield self.obtenerRaw({ argumentos: argumentosProfesores, metodo: config.metodos.profesores })
                profesoresJson = self.generarJsonProfesor({ raw, tipo: config.tipoProfesor({ tipo }) })
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
    /**
      * @promise
      * Devuelve el xml del lo que se pida de la webService.
      * Es usada tanto en estudiantes, peers o profesores
      * @param { json } argumentos - dependiento que cual sea el metodo, debe pasarse los argumentos.
      *                              ver el archivo json.schema.js
      * @param { string } metodo - ver el archivo config.js para los metodos disponibles
      * @resolve { string }  
      * @reject { error }  
    */
    obtenerRaw({ argumentos, metodo }) {
      if ( !argumentos || ! metodo)
        reject('No envia parametro: argumentos, metodo')
      return new Promise((resolve, reject) => {
        soap.createClient(URL, function(err, client) {
          client[metodo](argumentos, function(err, result, raw) {
            if (err) reject(err)
            resolve(raw)
          })
        })
      })
    },
    /**
      * Genera los paralelos existentes
      * @param { array } estudiantesJson - Los estudiantes siguiendo el formato de json.schema.js
      * @returns { array }  
    */
    generarJsonParalelosTodos({ estudiantesJson }) {
      let paralelos = _.uniqBy(estudiantesJson, (e) => {
        return [e.paralelo, e.codigoMateria].join()
      })
      let paralelosLimpiados = paralelos.map(function(paralelo) {
        return (({ codigoMateria, nombreMateria, paralelo }) => ({ codigoMateria, nombreMateria, paralelo }))(paralelo)
      }, [])
      return paralelosLimpiados
    },
    /**
      * Genera los estudiantes con las propiedades segun el archivo json.schema.js
      * @param { string } raw - xml pedido de la web service
      * @returns { array } - [estudiantes]
      * @returns { array } - [] Vacio si no hay datos
    */
    generarJsonEstudiante({ raw }) {
      if ( !raw )
        reject('No envia parametro: raw')
      let estudiantesDatos = []
      let load = cheerio.load(raw)
      load('Estudiantes').each(function(index, elem) { // recorrer cada estudiante
        let $ = cheerio.load(load.html(load(this)))
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
    /**
      * Genera el profesor con las propiedades segun el archivo json.schema.js
      * @param { string } raw - xml pedido de la web service
      * @param { string } tipo - ver el archivo de config.js
      * @returns { json } - {profesor}
      * @returns { json } - {} Vacio si no hay datos
    */
    generarJsonProfesor({ raw, tipo }) {
      if ( !raw )
        reject('No envia parametro: raw')
      let $ = cheerio.load(raw)
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
    /**
      * @Promise
      * Guarda en la base de datos
      * @param { array } paralelosJson - paralelos segun el esquema json.schema.js
      * @resolve { boolen } - true
      * @reject { err }
    */
    guardarParalelos({ paralelosJson }) {
      const cantidaParalelos = paralelosJson.length
      return new Promise((resolve, reject) => {
        co(function *() {
          for (var i = 0; i < cantidaParalelos ; i++) {
            let { codigoMateria, nombreMateria, paralelo, termino, anio } = paralelosJson[i]
            let estado = yield db.crearParalelo({ codigoMateria, nombreMateria, paralelo, termino, anio })
            if (!estado) {
              logger.error('guardarParalelos', paralelosJson[i])
            }
          }
          resolve(true)
        }).catch((err) => {
          logger.error('guardarParalelos', err)
          reject(err)
        })
      })
    },
    /**
      * @Promise
      * Guarda en la base de datos
      * @param { array } profesoresJson - profesores segun el esquema json.schema.js
      * @resolve { boolean } - true
      * @reject { error }
    */
    guardarProfesores({ profesoresJson }) {
      const cantidaProfesores = profesoresJson.length
      return new Promise((resolve, reject) => {
        co(function *() {
          for (var i = 0; i < cantidaProfesores ; i++) {
            let { nombres, apellidos, correo, tipo, paralelo, codigoMateria } = profesoresJson[i]
            let estado = yield db.crearProfesor({ nombres, apellidos, correo, tipo })
            let estadoParalelo = yield db.anadirProfesorAParalelo({ paralelo: { curso: paralelo, codigo: codigoMateria }, profesorIdentificador: correo })
            if (!estado || !estadoParalelo) {
              logger.error('guardarProfesores', profesoresJson[i])
            }
          }
          resolve(true)
        }).catch((err) => {
          logger.error('guardarProfesores', err)
          reject(err)
        })
      })
    },
    /**
      * @Promise
      * Guarda en la base de datos
      * @param { array } estudiantesJson - estudiantes segun el esquema json.schema.js
      * @returns { boolean } - true
      * @reject { error }
    */
    guardarEstudiantes({ estudiantesJson }) {
      const cantidadEstudiantes = estudiantesJson.length
      return new Promise((resolve, reject) => {
        co(function *() {
          for (var i = 0; i < cantidadEstudiantes ; i++) {
            let { nombres, apellidos, correo, matricula, paralelo, codigoMateria } = estudiantesJson[i]
            let estado = yield db.crearEstudiante({ nombres, apellidos, correo, matricula })
            let estadoParalelo = yield db.anadirEstudiantAParalelo({ paralelo: { curso: paralelo, codigo: codigoMateria }, estudianteIdentificador: correo })
            if (!estado || !estadoParalelo) {
              logger.error('guardarEstudiantes', estudiantesJson[i])
            }
          }
          resolve(true)
        }).catch((err) => {
          logger.error('guardarEstudiantes', err)
          reject(err)
        })
      })
    },

    // actualizaciones
    /**
      * @Promise
      * @param { array } estudiantesWS - estudiantes leidos de la webService
      * @param { array } estudiantesDB - estudiantes leidos de la db
      * @nota Revisar bien el archivo json.schema.js para ver el formato que debe serguir
      * @resolve { boolean } - true  si se tienen datos que actualizar
      * @resolve { boolean } - false si no hay nada que actualizar
      * @reject { err }
      * TODO: json no valido de cada entrada
    */
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
              const estudiantesDBEditados = _.intersectionBy(estudiantesDB, estudiantesEditados, 'matricula')
              const estudiantesWSEditados = _.intersectionBy(estudiantesWS, estudiantesEditados, 'matricula')
              const diferencias = jsondiffpatch.diff(estudiantesDBEditados, estudiantesWSEditados)
              if (diferencias)
                yield self.actualizarEstudiantesEditados({ diferencias, estudiantesEditados })
            }
            if (hayEstudiantesEliminados) {
              logger.info('estudiantes eliminados', estudiantesEliminadosDB)
              yield self.actualizarEstudiantesRetirados({ estudiantesEliminadosDB })
            }
            if (hayEstudiantesNuevos) {
              logger.info('estudiantes nuevos', estudiantesNuevosWS)
              yield self.actualizarEstudiantesAnadidos({ estudiantesNuevosWS })
            }
            resolve(true)
          }).catch((err) => {
            logger.error('actualizarEstudiantes',err)
            reject(err)
          })
        } else {
          resolve(false)
        }
      })
    },
    /**
      * @Promise
      * @param { array } estudiantesEliminadosDB
      * @returns { }
      * @reject { error }
    */
    actualizarEstudiantesRetirados({ estudiantesEliminadosDB }) {
      return new Promise((resolve, reject) => {
        co(function *() {
          let cantidadEstudiantesEliminados = estudiantesEliminadosDB.length
          for (let i = 0; i < cantidadEstudiantesEliminados; i++) {
            let estudiante = estudiantesEliminadosDB[i]
            let estudianteIdentificador = estudiante['matricula']
            let fueHecho = yield db.eliminarEstudiante({ estudianteIdentificador })
            if (!fueHecho) {
              logger.error('actualizarEstudiantesRetirados',estudiante)
            }
          }
          resolve(true)
        }).catch((err) => {
          logger.error('actualizarEstudiantesRetirados',err)
          reject(err)
        })
      })
    },
    /**
      * @Promise
      * @param { array } estudiantesNuevosWS
      * @returns { }
      * @reject { error }
    */
    actualizarEstudiantesAnadidos({ estudiantesNuevosWS }) {
      return new Promise((resolve, reject) => {
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
              logger.error('actualizarEstudiantesAnadidos',estudiante)
            }
          }
          resolve(true)
        }).catch((err) => {
          logger.error('actualizarEstudiantesAnadidos',err)
          reject(err)
        })
      })
    },
    /**
      * @Promise
      * @param { json } diferencias - ver la libreria jsondiffpatch para major detalle
      * @param { array } estudiantesEditados
      * @resolve { }
      * @reject { error }
    */
    actualizarEstudiantesEditados({ diferencias, estudiantesEditados }) {
      const self = this
      return new Promise((resolve, reject) => {
        const estudiantesConCambios = Object.keys(diferencias)
        const cantidadEstudiantesCambiados = estudiantesConCambios.length - 1 // porque al libreria al ultimo genera un dato de informacion no util por el momento
        let estudiantesCambiadoParalelo = []
        let estudiantesCambiadoCorreo = []
        let estudiantesCambiadosNombres = []
        let estudiantesCambiadosApellidos = []
        for (let i = 0; i < cantidadEstudiantesCambiados; i++) {
          let estudiante =  estudiantesEditados[estudiantesConCambios[i]]
          let seCambioParalelo = diferencias[estudiantesConCambios[i]].paralelo
          let seCambioCorreo = diferencias[estudiantesConCambios[i]].correo
          let seCambioNombres = diferencias[estudiantesConCambios[i]].nombres
          let seCambioApellidos = diferencias[estudiantesConCambios[i]].apellidos
          if (seCambioParalelo) {
            let paraleloNuevo =  diferencias[estudiantesConCambios[i]].paralelo[1]
            let estudianteAnadir = JSON.parse(JSON.stringify(estudiante))
            estudianteAnadir['paraleloNuevo'] = paraleloNuevo
            estudiantesCambiadoParalelo.push(estudianteAnadir)
          }
          if (seCambioCorreo) {
            let correoNuevo =  diferencias[estudiantesConCambios[i]].correo[1]
            let estudianteAnadir = JSON.parse(JSON.stringify(estudiante))
            estudianteAnadir['correoNuevo'] = correoNuevo
            estudiantesCambiadoCorreo.push(estudianteAnadir)
          }
          if (seCambioNombres) {
            let nombresNuevo =  diferencias[estudiantesConCambios[i]].nombres[1]
            let estudianteAnadir = JSON.parse(JSON.stringify(estudiante))
            estudianteAnadir['nombresNuevo'] = nombresNuevo
            estudiantesCambiadosNombres.push(estudianteAnadir)
          }
          if (seCambioApellidos) {
            let apellidosNuevo =  diferencias[estudiantesConCambios[i]].apellidos[1]
            let estudianteAnadir = JSON.parse(JSON.stringify(estudiante))
            estudianteAnadir['apellidosNuevo'] = apellidosNuevo
            estudiantesCambiadoCorreo.push(estudianteAnadir)
          }
        }
        logger.info('estudiantes cambiado paralelo',estudiantesCambiadoParalelo)
        logger.info('estudiantes cambiado correo', estudiantesCambiadoCorreo)
        logger.info('estudiantes cambiado nombres',estudiantesCambiadosNombres)
        logger.info('estudiantes cambiado apellidos', estudiantesCambiadosApellidos)
        co(function* () {
          const paralelos = yield db.paralelos({})
          yield self.actualizarEstudiantesCambiadosParalelo({ estudiantesCambiadoParalelo })
          yield self.actualizarEstudiantesCambiadoCorreo({ estudiantesCambiadoCorreo })
          yield self.actualizarEstudiantesCambiadoNombres({ estudiantesCambiadosNombres })
          yield self.actualizarEstudiantesCambiadoApellidos({ estudiantesCambiadosApellidos })
          resolve(true)
        }).catch((err) => {
          logger.error('actualizarEstudiantesEditados',err)
          reject(err)
        })
      })
    },
    /**
      * @Promise
      * @param { array } estudiantesCambiadoParalelo
      * @resolve { }
      * @reject { error }
    */
    actualizarEstudiantesCambiadosParalelo({ estudiantesCambiadoParalelo }) {
      return new Promise((resolve, reject) => {
        co(function* () {
          let cantidadEstudiantes = estudiantesCambiadoParalelo.length
          for (let i = 0; i < cantidadEstudiantes; i++) {
            let estudiante = estudiantesCambiadoParalelo[i]
            let estudianteIdentificador = estudiante['matricula']
            let paraleloNuevo = estudiante['paraleloNuevo']
            let seCambio = yield db.cambiarEstudianteParalelo({ paraleloNuevo, estudianteIdentificador })
            if (!seCambio) {
              logger.error('actualizarEstudiantesCambiadosParalelo', estudiante)
            }
          }
          resolve(true)
        }).catch((err) => {
          logger.error('actualizarEstudiantesCambiadosParalelo', err)
          reject(err)
        })
      })
    },
    /**
      * @Promise
      * @param { array } estudiantesCambiadoCorreo
      * @resolve { }
      * @reject { error }
    */
    actualizarEstudiantesCambiadoCorreo({ estudiantesCambiadoCorreo }) {
      return new Promise((resolve, reject) => {
        co(function* () {
          let cantidadEstudiantes = estudiantesCambiadoCorreo.length
          for (let i = 0; i < cantidadEstudiantes; i++) {
            let estudiante = estudiantesCambiadoCorreo[i]
            let estudianteIdentificador = estudiante['matricula']
            let correoNuevo = estudiante['correoNuevo']
            let seCambio = yield db.cambiarCorreoEstudiante({ correoNuevo, estudianteIdentificador })
            if (!seCambio) {
              logger.error('actualizarEstudiantesCambiadoCorreo', estudiante)
            }
          }
          resolve(true)
        }).catch((err) => {
          logger.error('actualizarEstudiantesAnadidos', err)
          reject(err)
        })
      })
    },
    /**
      * @Promise
      * @param { array } estudiantesCambiadosNombres
      * @resolve { }
      * @reject { error }
    */
    actualizarEstudiantesCambiadoNombres({ estudiantesCambiadosNombres }) {
      return new Promise((resolve, reject) => {
        co(function* () {
          let cantidadEstudiantes = estudiantesCambiadosNombres.length
          for (let i = 0; i < cantidadEstudiantes; i++) {
            let estudiante = estudiantesCambiadosNombres[i]
            let estudianteIdentificador = estudiante['matricula']
            let nombresNuevo = estudiante['nombresNuevo']
            let seCambio = yield db.cambiarNombresEstudiante({ nombresNuevo, estudianteIdentificador })
            if (!seCambio) {
              logger.error('actualizarEstudiantesCambiadoNombres', estudiante)
            }
          }
          resolve(true)
        }).catch((err) => {
          logger.error('actualizarEstudiantesCambiadoNombres', err)
          reject(err)
        })
      })
    },
    actualizarEstudiantesCambiadoApellidos({ estudiantesCambiadosApellidos }) {
      return new Promise((resolve, reject) => {
        co(function* () {
          let cantidadEstudiantes = estudiantesCambiadosApellidos.length
          for (let i = 0; i < cantidadEstudiantes; i++) {
            let estudiante = estudiantesCambiadosApellidos[i]
            let estudianteIdentificador = estudiante['matricula']
            let apellidosNuevo = estudiante['apellidosNuevo']
            let seCambio = yield db.cambiarApellidosEstudiante({ apellidosNuevo, estudianteIdentificador })
            if (!seCambio) {
              logger.error('actualizarEstudiantesCambiadoApellidos', estudiante)
            }
          }
          resolve(true)
        }).catch((err) => {
          logger.error('actualizarEstudiantesCambiadoApellidos', err)
          reject(err)
        })
      })
    },
    actualizarProfesores({ profesoresWS, profesoresDB }) {
      // cambio de paralelo
      // retirado
    },
    actualizarParalelo({ paralelosWS, paralelosDB }) {
      // agregar uno nuevo
      // eliminar uno
    },
    // helpers
    /**
      * Anade al propiedades termino y anio a un array de objetos json
      * @param { string } termino
      * @param { string } anio
      * @param { array } json
      * @return { error }
    */
    anadirTerminoYAnio({ termino, anio, json }) {
      let datosAnadidos = json.map((obj) => {
        obj.termino = termino
        obj.anio = anio
        return obj
      })
      return datosAnadidos
    }
  }
  return Object.assign(Object.create(proto), {})
}
