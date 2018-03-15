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
  paralelo: { type: String },
  estudiantes: [{
    type: String,
    ref: 'Estudiante',
    field: 'correo'
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

}

ProfesorSchema.statics = {

}

ParaleloSchema.statics = {
  anadirEstudiante({ paralelo: { curso, codigo }, estudianteCorreo }) {
    const self = this
    return new Promise(function(resolve) {
      self.update({$and: [{ codigo }, { curso }]}, {$addToSet: {'estudiantes': estudianteCorreo }}).then((accionEstado) => {
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
  }
}


module.exports = {
  Estudiante: mongoose.model('Estudiante', EstudianteSchema),
  Profesor: mongoose.model('Profesor', ProfesorSchema),
  Paralelo: mongoose.model('Paralelo', ParaleloSchema)
}
