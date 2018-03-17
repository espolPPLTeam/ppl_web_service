const dump = require('./dump')
const profesoresBase = dump.profesoresJsonBase
const profesores = dump.profesoresJson()[1]
const merge = require('deepmerge')
let a = merge(profesoresBase, profesores)
console.log(a)
