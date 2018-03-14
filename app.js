module.exports = ({ url, soap, cheerio, fs, path }) => {
  const _url_ = url
  const _soap_ = soap
  const _cheerio_ = cheerio
  const _fs_ = fs
  const _path_ = path
  const proto = {
    obtenerRaw({ argumentos, metodo }) {
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
      return profesorDatos
    },
    anadirTerminoYAnio({ datos, argumentos }) {
      let datosAnadidos = datos.map((obj) => {
        obj.termino = argumentos['termino']
        obj.anio = argumentos['anio']
        return obj
      })
      return datosAnadidos
    },
    buscarTodos({}) {

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
