const dump = require('./dump')
const _ = require('lodash')
const profesoresBase = dump.profesoresJsonBase
const profesores = dump.profesoresJson()[1]
const merge = require('deepmerge')
let a = merge(profesoresBase, profesores)
// console.log(_.uniqBy(a, 'correo'))
console.log(a)

// const exec = require('child_process').exec;
// var yourscript = exec('sh ./hi.sh',
//         (error, stdout, stderr) => {
//             console.log(`${stdout}`);
//             console.log(`${stderr}`);
//             if (error !== null) {
//                 console.log(`exec error: ${error}`);
//             }
//         });
