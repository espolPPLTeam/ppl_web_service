module.exports = ({ soap, cheerio, co, fs, path, config, db, _ }) => {
  const _url_ = config.url
  const _soap_ = soap
  const _cheerio_ = cheerio
  const _fs_ = fs
  const _path_ = path
  const _config_ = config
  const _co_ = co
  const paralelos = []
  const proto = {
    generarJsonEstudiantesTodos({ }) {
      const self = this
      return new Promise((resolve, reject) => {
        _co_(function *() {
          const materias = Object.keys(_config_.materiaCodigo).map((k) => _config_.materiaCodigo[k])
          const terminoActual = _config_.terminoActual()
          const anioActual = _config_.anioActual
          let estudiantesTodos  = []
          for (let i = 0; i < materias.length; i++) {
            let paralelo = _config_.paraleloDesde
            let codigomateria = materias[i]
            while (true) { // buscar por cada paralelo
              let argumentosEstudiantes = {
                anio: anioActual,
                termino: terminoActual,
                paralelo,
                codigomateria
              }
              let raw =  yield self.obtenerRaw({ argumentos: argumentosEstudiantes, metodo: config.metodos.estudiantes })
              let estudiantesJson = self.generarJsonEstudiante({ raw })
              if (!estudiantesJson.length) {
                break
              }
              estudiantesTodos = [...estudiantesTodos, ...estudiantesJson] // anadir estudiantes
              paralelo++ // aumentar el numero del paralelo
            }
          }
          resolve(estudiantesTodos)
        }).catch((err) => console.log(err))
      })
    }
    generarJsonEstudiantesTodosDB({ }) {

    },
    generarJsonEstudiantesTodosMock({ }) {
    },
    generarJsonEstudiantesTodosDBMock({ }) {
    },
    // tambien tiene que leer datos de un json predeterminado
    generarJsonProfesoresTodos({ }) {
      const self = this
      return new Promise((resolve, reject) => {
        _co_(function *() {
          const materias = Object.keys(_config_.materiaCodigo).map((k) => _config_.materiaCodigo[k])
          const terminoActual = _config_.terminoActual()
          const anioActual = _config_.anioActual
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
                profesoresJson = self.generarJsonProfesor({ raw })
                let estaVacio = !_.isEmpty(profesoresJson)
                if (estaVacio) {
                  profesoresJson['tipo'] = _config_.tipoProfesor({ tipo })
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
    generarJsonProfesoresTodosDB({ }) {

    },
    generarJsonProfesoresTodosDBMock({ }) {
    },
    generarJsonProfesoresTodosMock({ }) {
    },
    generarJsonParalelosTodos({ }) {

    },
    generarJsonParalelosTodosMock({ }) {

    },
    guardarParalelos({}) {

    },
    guardarProfesores({}) {

    },
    guardarEstudiantes({ }) {

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
    // devuelve array vacio si ya no hay datos
    // errores: comprobar que todos generen el json con todos los datos, si no escibir en un logger
    //          compronar que todos tengan correo espol
    generarJsonEstudiante({ raw }) {
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
    // si no tiene nada devuelve {}
    // no anade el tipo
    generarJsonProfesor({ raw }) {
      if ( !raw )
        reject('No envia parametro: raw')
      let $ = _cheerio_.load(raw)
      let profesorDatos = {
        nombres: $('NOMBRES').text().trim(),
        apellidos: $('APELLIDOS').text().trim(),
        correo: $('EMAIL').text().trim(),
        // datos paralelo
        paralelo: $('PARALELO').text().trim(),
        codigoMateria: $('CODIGOMATERIA').text().trim(),
        nombreMateria: $('NOMBRE').text().trim()
      }
      return profesorDatos['correo'] ? profesorDatos : {}
    },
    anadirTerminoYAnio({ datos, argumentos }) {
      let datosAnadidos = datos.map((obj) => {
        obj.termino = argumentos['termino']
        obj.anio = argumentos['anio']
        return obj
      })
      return datosAnadidos
    },
    saveFile({ tipo, argumentos, raw }) {
      if (tipo === 'estudiante') {
        _fs_.appendFileSync(_path_.join(__dirname, `dump/${tipo}__${argumentos['anio']}_${argumentos['termino']}_${argumentos['codigomateria']}_${argumentos['paralelo']}.wsdl`), raw)
      } else if (tipo === 'profesor') {
        _fs_.appendFileSync(_path_.join(__dirname, `dump/${tipo}_${argumentos['anio']}_${argumentos['termino']}_${argumentos['codigomateria']}_${argumentos['paralelo']}_${argumentos['tipo']}.wsdl`), raw)
      } else {
        return false
      }
      return true
    },

    // actualizaciones
    actualizarEstudiantes({ estudiantesWS, estudiantesDB }) {

    },
    actualizarProfesores({ profesoresWS, profesoresDB }) {

    },
    actualizarParalelo({ paralelosWS, paralelosDB }) {

    }
  }
  return Object.assign(Object.create(proto), {})
}

// crear json de todos los estudiantes de todos los paralelos
// crear json de todos los profesores de todos los paralelos

// crear paralelos
// crear estudiantes
// crear profesores (con ws y con json), ojo con los peers
// crear integrantes (con ws y con json)

// Metodos

// obtenerEstudiante
// obtenerTodosParalelos
// obtenerParaleloDeEstudiante
// obtenerProfesorJsonPorNombres
// estudiantesIguales
// eliminarEstudianteDB
// obtenerEstudiantePorMatricula
// obtenerTodosParalelos
// encontrarParalelo
// cambiarEstudianteDeParalelo
// crearEstudianteYAnadirloAParalelo
// estudiantesCambiadosDeCurso
// editarApellidos
// editarNombres
// editarCorreo
// eliminarEstudianteDeGrupos
