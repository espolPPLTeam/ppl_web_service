const mongo = require('./mongo/db')
const schema = require('./mongo/schema')
const WSPPL = require('./index.js')
const profesoresBase = require('./dump').profesoresJsonBase // tomara prioridad lo que esta en este archivo y se reemplazar si es necesario de lo que obtenga de la web

const dbMock = {
	crearEstudiante({ nombres, apellidos, correo, matricula, paralelo,  codigoMateria }) { // null si no se creo o lo que sea?
    return new Promise(function(resolve) {
      let estudiante = new schema.Estudiante({ correo, matricula, nombres, apellidos })
      Promise.all([
        schema.Paralelo.anadirEstudiante({ paralelo: { curso: paralelo, codigo: codigoMateria }, estudianteCorreo: correo }),
        estudiante.crear()
      ]).then((values) => {
        console.log(values[0])
        resolve(true)
      }).catch((err) => {
        console.error(err)
        reject(err)
      })
    })
	},
	crearProfesor({ nombres, apellidos, correo, tipo, paralelo, codigoMateria }) {
    let profesor = new schema.Profesor({ correo, tipo, nombres, apellidos })
    return new Promise(function(resolve) {
      Promise.all([
        schema.Paralelo.anadirProfesor({ paralelo: { curso: paralelo, codigo: codigoMateria }, profesorCorreo: correo }),
        profesor.crear()
      ]).then((values) => {
        resolve(values[0])
      }).catch((err) => {
        console.error(err)
        reject(err)
      })
    })
	},
	crearParalelo({ codigoMateria, nombreMateria, paralelo, termino, anio }) {
		return new Promise(function(resolve, reject) {
      let paraleloCreado = new schema.Paralelo({ codigo: codigoMateria, nombre: nombreMateria, curso: paralelo, termino, anio })
      paraleloCreado.crear()
        .then((res) => {
          resolve(paraleloCreado)
      }).catch((err) => {
        console.error(err)
        reject(err)
      })
    })
	}
}

const wsPPL = WSPPL({ db: dbMock, anio: '2017', termino: '2s', profesoresBase })
mongo.Conectar(process.env.MONGO_URL).then((res) => {
  // mongo.Limpiar()
	wsPPL.inicializar()
})
