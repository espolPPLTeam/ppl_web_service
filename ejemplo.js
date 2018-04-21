const mongo = require('./mongo/db')
const WSPPL = require('./index.js')
const db = require('./dbMock')
const dump = require('./dump')
const wsPPL = WSPPL({ db, anio: '2017', termino: '1s', local: true, cron: '00 * * * * *', dump })
mongo.Conectar(`mongodb://localhost/testPPL`).then((res) => {
	 wsPPL.inicializar().then((resp) => {
	 	wsPPL.actualizar()
	 })
})
