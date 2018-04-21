const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const EstudianteSchema = mongoose.Schema({
  nombres: { type: String },
  apellidos: { type: String },
  correo: { type: String },
  matricula: { type: String }
},{timestamps: false, versionKey: false, collection: 'estudiantes'})

const ProfesorSchema = mongoose.Schema({
  nombres: { type: String },
  apellidos: { type: String },
  correo: { type: String },
  tipo: { type: String }
},{timestamps: false, versionKey: false, collection: 'profesores'})

const ParaleloSchema = mongoose.Schema({
  curso: { type: String },
  codigo: { type: String },
  anio: { type: String },
  termino: { type: String, enum: ['1s', '2s'] },
  nombres: { type: String },
  estudiantes: [{
    type: String,
    ref: 'Estudiante',
    field: 'matricula'
  }],
  profesores: [{
    type: String,
    ref: 'Profesor',
    field: 'matricula'
  }],
},{timestamps: false, versionKey: false, collection: 'paralelos'})

EstudianteSchema.methods = {
  crear() {
    let self = this
    return Promise.resolve(self.save())
  }
}

ParaleloSchema.methods = {
  crear() {
    let self = this
    return new Promise(function(resolve) {
      resolve(self.save())
    })
  }
}

ProfesorSchema.methods = {
  crear() {
    let self = this
    return new Promise(function(resolve) {
      resolve(self.save())
    })
  }
}

EstudianteSchema.statics = {
  obtenerTodos() {
    const self = this
    return new Promise(function(resolve) {
      resolve(self.find({}))
    })
  },
  eliminar({ matricula }) {
    const self = this
    return new Promise(function(resolve) {
      self.findOneAndRemove({ matricula }).then((accionEstado) => {
        if (accionEstado) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  },
  actualizarCorreo({ matricula, correoNuevo }) {
    const self = this
    return new Promise(function(resolve) {
      self.update({ matricula }, {$set: { correo: correoNuevo }}).then((accionEstado) => {
        resolve(accionEstado.nModified ? true : false)
      })
    })
  },
  actualizarNombres({ matricula, nombresNuevo }) {
    const self = this
    return new Promise(function(resolve) {
      self.update({ matricula }, {$set: { nombres: nombresNuevo }}).then((accionEstado) => {
        resolve(accionEstado.nModified ? true : false)
      })
    })
  },
  actualizarApellidos({ matricula, apellidosNuevo }) {
    const self = this
    return new Promise(function(resolve) {
      self.update({ matricula }, {$set: { apellidos: apellidosNuevo }}).then((accionEstado) => {
        resolve(accionEstado.nModified ? true : false)
      })
    })
  }
}

ProfesorSchema.statics = {
	obtenerTodos() {
    const self = this
    return new Promise(function(resolve) {
      resolve(self.find({}))
    })
  },
  eliminarEstudiante({ paralelo: { curso, codigo }, estudianteMatricula }) {
    const self = this
    return new Promise(function(resolve) {
      self.update({$and: [{ codigo }, { curso }]}, {$pull: {'estudiantes': estudianteMatricula }}).then((accionEstado) => {
        resolve(accionEstado.nModified ? true : false)
      })
    })
  }
}

ParaleloSchema.statics = {
  obtenerTodos() {
    const self = this
    return new Promise(function(resolve) {
      resolve(self.find({}))
    })
  },
  anadirEstudiante({ paralelo: { curso, codigo }, estudianteMatricula }) {
    const self = this
    return new Promise(function(resolve) {
      self.update({$and: [{ codigo }, { curso }]}, {$addToSet: {'estudiantes': estudianteMatricula }}).then((accionEstado) => {
        resolve(accionEstado.nModified ? true : false)
      })
    })
  },
  anadirProfesor({ paralelo: { curso, codigo }, profesorCorreo }) {
    const self = this
    return new Promise(function(resolve) {
      self.update({$and: [{ codigo }, { curso }]}, {$addToSet: {'profesores': profesorCorreo }}).then((accionEstado) => {
        resolve(accionEstado.nModified ? true : false)
      })
    })
  },
  eliminarEstudiante({ paralelo: { curso, codigo }, estudianteMatricula }) {
    const self = this
    return new Promise(function(resolve) {
      self.update({$and: [{ codigo }, { curso }]}, {$pull: {'estudiantes': estudianteMatricula }}).then((accionEstado) => {
        resolve(accionEstado.nModified ? true : false)
      })
    })
  },
  obtenerParaleloEstudiante({ estudianteMatricula }) {
    const self = this
    return new Promise(function(resolve) {
      resolve(self.findOne({ estudiantes: estudianteMatricula }))
    })
  }
}


module.exports = {
  Estudiante: mongoose.model('Estudiante', EstudianteSchema),
  Profesor: mongoose.model('Profesor', ProfesorSchema),
  Paralelo: mongoose.model('Paralelo', ParaleloSchema)
}
