const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const EstudianteSchema = mongoose.Schema({

},{timestamps: false, versionKey: false, collection: 'estudiantes'})

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
  eliminar({ estudianteCorreo }) {
    const self = this
    return new Promise(function(resolve) {
      self.findOneAndRemove({ correo: estudianteCorreo }).then((accionEstado) => {
        if (accionEstado) {
          resolve(true)
        } else {
          resolve(false)
        }
      })
    })
  })
}

module.exports = {
  Estudiante: mongoose.model('Estudiante', EstudianteSchema)
}
