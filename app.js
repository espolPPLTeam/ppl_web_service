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
          logger.error(`generarJsonEstudiantesTodos: ${JSON.stringify(err, null, 2)}`)
          reject(err)
        })
      })
    },
    /**
      * @promise
      * Devuelve todos los profesores de todos los paralelos.
      * @param {string} termino - puede ser 1s o 2s
      * @param {string} anio
      * @resolve {array} profesores
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
      * @testeado @t1, @t2
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
      * @testeado @t6
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
      * @testeado @t3
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
      * @testeado @t4
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
      * @testing @t7.1
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
              logger.error(`guardarParalelos: ${JSON.stringify(paralelosJson[i], null, 2)}`)
            }
          }
          resolve(true)
        }).catch((err) => {
          logger.error(`guardarParalelos: ${JSON.stringify(err, null, 2)}`)
          reject(err)
        })
      })
    },
    /**
      * @testing @t7.3
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
          for (let i = 0; i < cantidaProfesores ; i++) {
            let profesor = profesoresJson[i]
            let { nombres, apellidos, correo, tipo, paralelo, codigoMateria } = profesor
            let fueCreado = yield db.crearProfesor({ nombres, apellidos, correo, tipo, paralelo, codigoMateria })
            if (!fueCreado) {
              logger.error(`guardarProfesores: ${JSON.stringify(profesor, null, 2)}`)
            }
          }
          resolve(true)
        }).catch((err) => {
          logger.error(`guardarProfesores: ${JSON.stringify(err, null, 2)}`)
          reject(err)
        })
      })
    },
    /**
      * @testing @t7.2
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
          for (let i = 0; i < cantidadEstudiantes ; i++) {
            let estudiante = estudiantesJson[i]
            let { nombres, apellidos, correo, matricula, paralelo, codigoMateria } = estudiante
            let estado = yield db.crearEstudiante({ nombres, apellidos, correo, matricula, paralelo, codigoMateria })
            if (!estado) {
              logger.error(`guardarEstudiantes: ${JSON.stringify(estudiante, null, 2)}`)
            }
          }
          resolve(true)
        }).catch((err) => {
          logger.error(`guardarEstudiantes: ${JSON.stringify(err, null, 2)}`)
          reject(err)
        })
      })
    },

    // actualizaciones
    /**
      * @testing @t7.4
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
              logger.info(`estudiantes eliminados: ${JSON.stringify(estudiantesEliminadosDB, null, 2)}`)
              yield self.actualizarEstudiantesRetirados({ estudiantesEliminadosDB })
            }
            if (hayEstudiantesNuevos) {
              logger.info(`estudiantes nuevo: ${JSON.stringify(estudiantesNuevosWS, null, 2)}`)
              yield self.actualizarEstudiantesAnadidos({ estudiantesNuevosWS })
            }
            resolve(true)
          }).catch((err) => {
            logger.error(`actualizarEstudiantes: ${JSON.stringify(err, null, 2)}`)
            reject(err)
          })
        } else {
          resolve(false)
        }
      })
    },
    /**
      * @testing @t7.4.2
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
            let correo = estudiante['correo']
            let matricula = estudiante['matricula']
            let { paralelo, codigoMateria } = estudiante
            let fueHecho = yield db.eliminarEstudiante({ paralelo, codigoMateria, correo, matricula })
            if (!fueHecho) {
              logger.error(`actualizarEstudiantesRetirados: ${JSON.stringify(estudiante, null, 2)}`)
            }
          }
          resolve(true)
        }).catch((err) => {
          logger.error(`actualizarEstudiantesRetirados: ${JSON.stringify(err, null, 2)}`)
          reject(err)
        })
      })
    },
    /**
      * @testing @t7.4.3
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
            let estudianteIdentificador = estudiante['correo']
            let { nombres, apellidos, correo, matricula, paralelo, codigoMateria } = estudiante
            let fueCreado = yield db.crearEstudiante({ nombres, apellidos, correo, matricula, paralelo,  codigoMateria })
            if (!fueCreado) {
              logger.error(`actualizarEstudiantesAnadidos: ${JSON.stringify(estudiante, null, 2)}`)
            }
          }
          resolve(true)
        }).catch((err) => {
          logger.error(`actualizarEstudiantesAnadidos: ${JSON.stringify(err, null, 2)}`)
          reject(err)
        })
      })
    },
    /**
      * @testing @t7.4.7
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
            estudiantesCambiadosApellidos.push(estudianteAnadir)
          }
        }
        if (estudiantesCambiadoParalelo.length)
          logger.info('estudiantes cambiado paralelo: ' + JSON.stringify(estudiantesCambiadoParalelo, null, 2))
        if (estudiantesCambiadoCorreo.length)
          logger.info('estudiantes cambiado correo: '+ JSON.stringify(estudiantesCambiadoCorreo, null, 2))
        if (estudiantesCambiadosNombres.length)
          logger.info('estudiantes cambiado nombres: ' + JSON.stringify(estudiantesCambiadosNombres, null, 2))
        if (estudiantesCambiadosApellidos.length)
          logger.info('estudiantes cambiado apellidos: ' + JSON.stringify(estudiantesCambiadosApellidos, null, 2))
        co(function* () {
          yield self.actualizarEstudiantesCambios({
            estudiantesDatos: estudiantesCambiadoParalelo,
            nombreMetodoDb: 'cambiarEstudianteParalelo', // @t7.4.1
            nombreDatoNuevo: 'paraleloNuevo'
          })
          yield self.actualizarEstudiantesCambios({
            estudiantesDatos: estudiantesCambiadoCorreo,
            nombreMetodoDb: 'cambiarCorreoEstudiante', // @t7.4.4
            nombreDatoNuevo: 'correoNuevo'
          })
          yield self.actualizarEstudiantesCambios({
            estudiantesDatos: estudiantesCambiadosNombres,
            nombreMetodoDb: 'cambiarNombresEstudiante', // @t7.4.5
            nombreDatoNuevo: 'nombresNuevo'
          })
          yield self.actualizarEstudiantesCambios({
            estudiantesDatos: estudiantesCambiadosApellidos,
            nombreMetodoDb: 'cambiarApellidosEstudiante', // @t7.4.6
            nombreDatoNuevo: 'apellidosNuevo'
          })
          resolve(true)
        }).catch((err) => {
          logger.error(`actualizarEstudiantesEditados: ${JSON.stringify(err, null, 2)}`)
          reject(err)
        })
      })
    },
    /**
      * @Promise
      * @param { estudiantesDatos }
      * @param { nombreMetodoDb }
      * @param { nombreDatoNuevo }
      * @resolve { }
      * @reject { error }
    */
    actualizarEstudiantesCambios({ estudiantesDatos, nombreMetodoDb, nombreDatoNuevo }) {
      return new Promise((resolve, reject) => {
        co(function* () {
          let cantidadEstudiantes = estudiantesDatos.length
          for (let i = 0; i < cantidadEstudiantes; i++) {
            let estudiante = estudiantesDatos[i]
            let correo = estudiante['correo']
            let matricula = estudiante['matricula']
            let nuevoDato = estudiante[nombreDatoNuevo]
            let seCambio = yield db[nombreMetodoDb]({ nuevo: nuevoDato, correo, matricula })
            if (!seCambio) {
              logger.error(`${nombreMetodoDb}: ${JSON.stringify(estudiante, null, 2)}`)
            }
          }
          resolve(true)
        }).catch((err) => {
          logger.error(`${nombreMetodoDb}: ${JSON.stringify(err, null, 2)}`)
          reject(err)
        })
      })
    },
    actualizarProfesores({ profesoresWS, profesoresDB }) {
      // cambio de paralelo
      // retirado
			// anadir
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
