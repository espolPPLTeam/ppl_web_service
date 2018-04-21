# PPL WEB SERVICE

Permite syncronizar los datos de la web service de ppl con cualquier base de datos solamente implementando algunos metodos predefinidos

## Features
- [x] Actualizacion automatica con cron
- [x] Inicializacion de la base de datos con la webService
- [ ] Poder definir un json customizado para los profesores que reemplazara por los pedidos de la base de datos
- [ ] Implemetar interface para metodos usados en la base de datos
- [ ] Tests de validacion de funcionamiento de los metodos de la interfaz implementados por el usuario para validar que funciona correctamente
- [ ] Copia de la base de datos antes de cada actualizacion
- [ ] Test unitarios y de integracion actualizados
- [ ] Documentacion de como correr la libreria

## Prerequisites

* Nodejs >= 8.0.0
* Mongo >= 3.3.0

## Deployment

## Development

__Folder Structure__

* index.js .- Archivo donde se llama a las funciones creadas

* app.js .- Declaracion de la funciones

* config.js .- Muestra todas las variables constantes

* ejemplo.js .- Lo que el nombre dice

* json.schema.js .- Declaracion de las respuestas

* logger.js

* prueba.js .- archivo para probar las librerias nuevas que se instalen 

__Uso de la libreria__

```js
const wsPPL = WSPPL({ 
  db, // instalcion de la db. Cada metodo tien que devolver una promesa
  anio: '2017', // 2017 2018
  termino: '1s', // 1s o 2s
  local: true, // para usar un json en local en vez de la web service
  cron: '00 * * * * *' // https://github.com/kelektiv/node-cron
})

db.Conectar(URL_DATABASE).then((res) => {
   wsPPL.inicializar()
   wsPPL.actualizar()
})
```

__Implementar llamada db__

Estos metodos tienen que ser implementado para poder realizar el test de comprobacion. Debe ser usando la base de datos

```js
let Conectar = function(url) {
  resolve(db)
}

let Desconectar = function() {
}

let Limpiar = function() {
  return new Promise(function(resolve) {
    resolve()
  })
}

module.exports = {
  Conectar,
  Desconectar,
  Limpiar
}
```

__Declaración de la db__

```js
  const db = {
    crearEstudiante({ nombres, apellidos, correo, matricula, paralelo,  codigoMateria }) {
      return new Promise((resolve, reject) => {
        resolve(true) // false
        reject(err) // si no ocurrio algo inesperado
      })
    },
    obtenerTodosEstudiantes() {
      resolve() // { nombres, apellidos, matricula, correo, paralelo, codigoMateria }
    },
    crearProfesor({ nombres, apellidos, correo, tipo, paralelo, codigoMateria }) {
      resolve(true) // false
    },
    crearParalelo({ codigoMateria, nombreMateria, paralelo, termino, anio }) {
      resolve(true) // false
    },
    eliminarEstudiante({ paralelo, codigoMateria, correo, matricula }) {
      resolve(true) // false
    },
    cambiarEstudianteParalelo({ nuevo, correo, matricula }) {
      resolve(true) // false
    },
    cambiarCorreoEstudiante({ nuevo, correo, matricula }) {
      resolve(true) // false
    },
    cambiarNombresEstudiante({ nuevo, correo, matricula }) {
      resolve(true) // false
    },
    cambiarApellidosEstudiante({ nuevo, correo, matricula }) {
      resolve(true) // false
    },
    estaLleno() {
      resolve(true) // false
    }
  }
```

Estudiantes

```js
{
  nombres
  apellidos
  matricula
  correo
  paralelo
  codigoMateria
  nombreMateria
}
```

Profesores
```js
{
  nombres
  apellidos
  correo
  tipo
  paralelo
  codigoMateria
  nombreMateria
}
```

Paralelos
```js
{
  codigoMateria
  nombreMateria
  paralelo
  termino
  anio
}
```

## Testing

Para poder comprobar que se implemento correctamente los metodos usar el test con el tag @t7.5.
Debe crear un archivo donde implemente las funciones que se muestra en el archivo dbMock.js.
Puede borrar lo que esta alli e implementar sus funciones.

* El archivo json.schema.js se usa para validar que vengan los datos correctos
* Se buscaran 16 usuarios random para comprobar que todo este correcto
* En actualizar se borraran unos estudiantes para comprobar que todo este correcto tambien. Luego se reestablecera al estado anterio

## Authors

Joel Rodriguez
