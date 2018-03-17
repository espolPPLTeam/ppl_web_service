const moment = require('moment')
module.exports = {
  url: 'https://ws.espol.edu.ec/saac/wsPPL.asmx?WSDL',
  metodos: {
    estudiantes: 'wsConsultaEstudiantes',
    profesores: 'wsConsultaProfesores'
  },
  anioDesde: '2017',
  paraleloDesde: '1',
  materiaCodigo: {
    fisica2: 'FISG1002',
    fisica3: 'FISG1003',
    fisicaConceptual: 'FISG2001'
  },
  termino: {
    primer: '1s',
    segundo: '2s'
  },
  tiposProfesor: {
    peer: '1',
    titular: '0'
  },
  tipoProfesor({ tipo }) {
    if (tipo == '1') {
      return 'peer'
    } else if (tipo == '0') {
      return 'titular'
    }
    return ''
  },
  terminoActual: function() {
    // por alguna razon moment aumente con un mes a todo
    // isBetween, es trabaja con limite incluido
    const abril = 2
    const agosto = 7
    const septiembre = 8
    const febrero = 1
    const primerTerminoInicio = moment({ month: abril }) // mayo 5 = 5
    const primerTerminoFin = moment({ month: agosto }) // septiembre 9 = 8
    const segundoTerminoInicio = moment({ month: septiembre }) // octubre 10 = 9
    const segundoTerminoFin = moment({ month: febrero }).add(1, 'year') // febrero 2 = 1
    const hoy = moment()
    const primer = hoy.isBetween(primerTerminoInicio, primerTerminoFin)
    const segundo = hoy.isBetween(segundoTerminoInicio, segundoTerminoFin)
    if (primer) {
      return '1s'
    } else if (segundo) {
      return '2s'
    }
    return ''
  },
  anioActual: `${moment().year()}`
}
