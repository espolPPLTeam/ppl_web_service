const mongo = require('./mongo/db')
const schema = require('./mongo/schema')
const WSPPL = require('./index.js')
const profesoresBase = require('./dump').profesoresJsonBase // tomara prioridad lo que esta en este archivo y se reemplazar si es necesario de lo que obtenga de la web

const dbMock = {
	crearEstudiante({ nombres, apellidos, correo, matricula }) { // null si no se creo o lo que sea?
		return new Promise((resolve, reject) => {
      let estudiante = new schema.Estudiante({ correo, matricula, nombres, apellidos })
      estudiante.crear()
        .then(() => {
          resolve(estudiante)
      }).catch((err) => {
        console.error(err)
        reject(err)
      })
    })
	},
	crearProfesor({ nombres, apellidos, correo, tipo }) {
		return new Promise((resolve, reject) => {
      let profesor = new schema.Profesor({ correo, tipo, nombres, apellidos })
      profesor.crear()
        .then(() => {
          resolve(profesor)
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
        .then(() => {
          resolve(paraleloCreado)
      }).catch((err) => {
        console.error(err)
        reject(err)
      })
    })
	},
	anadirEstudiantAParalelo({ paralelo: { curso, codigo }, estudianteIdentificador }) {
		return new Promise(function(resolve) {
      Promise.all([
        schema.Paralelo.anadirEstudiante({ paralelo: { curso, codigo }, estudianteCorreo: estudianteIdentificador })
      ]).then((values) => {
        resolve(values[0])
      }).catch((err) => {
        console.error(err)
        reject(err)
      })
    })
	},
	anadirProfesorAParalelo({ paralelo: { curso, codigo }, profesorIdentificador }) {
		return new Promise(function(resolve) {
      schema.Paralelo.anadirProfesor({ paralelo: { curso, codigo }, profesorCorreo: profesorIdentificador })
        .then((resp) => {
          resolve(resp)
        }).catch((err) => {
          console.error(err)
          reject(err)
        })
    })
	}
}

const wsPPL = WSPPL({ db: dbMock, anio: '2017', termino: '2s', profesoresBase })
mongo.Conectar(process.env.MONGO_URL).then((res) => {
	wsPPL.inicializar()
})
