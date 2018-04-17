const schema = require('./mongo/schema')
const co = require('co')

module.exports = {
	crearEstudiante({ nombres, apellidos, correo, matricula, paralelo,  codigoMateria }) { // null si no se creo o lo que sea?
    return new Promise(function(resolve) {
      let estudiante = new schema.Estudiante({ correo, matricula, nombres, apellidos })
      Promise.all([
        schema.Paralelo.anadirEstudiante({ paralelo: { curso: paralelo, codigo: codigoMateria }, estudianteMatricula: matricula }),
        estudiante.crear()
      ]).then((values) => {
        resolve(values[0])
      }).catch((err) => {
        console.error(err)
        reject(err)
      })
    })
	},
	obtenerTodosEstudiantes() {
		return new Promise(function(resolve) {
			co(function* () {
				let estudiantesTodos = []
				const estudiantes = yield schema.Estudiante.obtenerTodos()
				for (var i = 0; i < estudiantes.length; i++) {
					let paralelo = yield schema.Paralelo.obtenerParaleloEstudiante({ estudianteMatricula: estudiantes[i]['matricula'] })
					let estudiante = JSON.parse(JSON.stringify(estudiantes[i]))
					estudiante['paralelo'] = paralelo['curso']
					estudiante['codigoMateria'] = paralelo['codigo']
					estudiantesTodos.push(estudiante)
				}
				resolve(estudiantesTodos)
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
	},
	eliminarEstudiante({ paralelo, codigoMateria, correo, matricula }) {
		return new Promise(function(resolve) {
        Promise.all([
          schema.Estudiante.eliminar({ matricula }),
          schema.Paralelo.eliminarEstudiante({ paralelo: { curso: paralelo, codigo: codigoMateria }, estudianteMatricula: matricula })
          ]).then((resp) => {
            resolve(true)
        }).catch((err) => {
					console.error(err)
	        reject(err)
        })
      })
	},
	cambiarEstudianteParalelo({ nuevo, correo, matricula }) {
		return new Promise((resolve, reject) => {
			co(function* () {
				let paralelo = yield schema.Paralelo.obtenerParaleloEstudiante({ estudianteMatricula: matricula })
				let cursoAntiguo = paralelo['curso']
				let codigoAntiguo = paralelo['codigo']
				let fueEliminado = yield schema.Paralelo.eliminarEstudiante({ paralelo: { curso: cursoAntiguo, codigo: codigoAntiguo }, estudianteMatricula: matricula })
				let estudiante = yield schema.Paralelo.anadirEstudiante({ paralelo: { curso: nuevo, codigo: codigoAntiguo }, estudianteMatricula: matricula })
				if (fueEliminado && estudiante) {
					resolve(true)
				} else {
					resolve(false)
				}
			}).catch((err) => {
				console.error(err)
				reject(err)
			})
    })
	},
	cambiarCorreoEstudiante({ nuevo, correo, matricula }) {
		return new Promise((resolve, reject) => {
			schema.Estudiante.actualizarCorreo({ matricula, correoNuevo: nuevo }).then((estado) => {
				if (estado) {
					resolve(true)
				} else {
					resolve(false)
				}
			}).catch((err) => {
				console.error(err)
				reject(err)
			})
    })
	},
	cambiarNombresEstudiante({ nuevo, correo, matricula }) {
		return new Promise((resolve, reject) => {
			schema.Estudiante.actualizarNombres({ matricula, nombresNuevo: nuevo }).then((estado) => {
				if (estado) {
					resolve(true)
				} else {
					resolve(false)
				}
			}).catch((err) => {
				console.error(err)
				reject(err)
			})
    })
	},
	cambiarApellidosEstudiante({ nuevo, correo, matricula }) {
		return new Promise((resolve, reject) => {
			schema.Estudiante.actualizarApellidos({ matricula, apellidosNuevo: nuevo }).then((estado) => {
				if (estado) {
					resolve(true)
				} else {
					resolve(false)
				}
			}).catch((err) => {
				console.error(err)
				reject(err)
			})
    })
	},
	estaLleno() {
		return new Promise((resolve, reject) => {
			schema.Paralelo.obtenerTodos().then((estado) => {
				if (estado.length !== 0) {
					resolve(true)
				} else {
					resolve(false)
				}
			}).catch((err) => {
				console.error(err)
				reject(err)
			})
		})
	},

	// Para revisar concordancia de la db
	obtenerEstudiante({ correo, matricula}) {

	},
	obtenerProfesor({ correo, matricula}) {

	},
	obtenerParalelo({ codigoMateria, nombreMateria, paralelo, termino, anio }) {

	},
	obtenerTodosParalelos({}) {

	},
	Conectar() {

	},
	Limpiar() {

	},
	Desconectar() {
		
	}
}