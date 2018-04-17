const mongo = require('./mongo/db')
const WSPPL = require('./index.js')
const db = require('./dbMock')

const wsPPL = WSPPL({ db, anio: '2017', termino: '1s', local: true, cron: '00 * * * * *' })
mongo.Conectar(`mongodb://localhost/testPPL`).then((res) => {
	 wsPPL.inicializar()
	 wsPPL.actualizar()
})
