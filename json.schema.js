let estudiante =  {
  "minProperties": 7,
  "additionalProperties": false,
  "properties": {
    "nombres": { "type": "string" },
    "apellidos": { "type": "string" },
    "correo": { "type": "string" },
    "matricula": { "type": "string" },
    "paralelo": { "type": "string" },
    "codigoMateria": { "type": "string" },
    "nombreMateria": { "type": "string" }
  }
}

let profesor = {
  "minProperties": 7,
  "additionalProperties": false,
  "properties": {
    "nombres": { "type": "string" },
    "apellidos": { "type": "string" },
    "correo": { "type": "string" },
    "tipo": { "type": "string", "enum": ["peer", "titular"] },
    "paralelo": { "type": "string" },
    "codigoMateria": { "type": "string" },
    "nombreMateria": { "type": "string" }
  }
}

let paralelo = {
  "minProperties": 5,
  "additionalProperties": false,
  "properties": {
    "codigoMateria": { "type": "string" },
    "nombreMateria": { "type": "string" },
    "paralelo": { "type": "string" },
    "termino": { "type": "string", "enum": ["1s", "2s"] },
    "anio": { "type": "string" }
  }
}

let paraleloSinTerminoAnio = {
  "minProperties": 3,
  "additionalProperties": false,
  "properties": {
    "codigoMateria": { "type": "string" },
    "nombreMateria": { "type": "string" },
    "paralelo": { "type": "string" }
  }
}

let estudianteDB = {
	"minProperties": 4,
  "additionalProperties": true,
  "properties": {
    "nombres": { "type": "string" },
    "apellidos": { "type": "string" },
    "correo": { "type": "string", "format": "email" },
    "matricula": { "type": "string" }
  }
}

let paraleloDB = {
	"minProperties": 4,
  "additionalProperties": true,
  "properties": {
    "estudiantes": { "type": "array" },
    "profesores": { "type": "array" },
    "codigo": { "type": "string" },
    "curso": { "type": "string" },
    "termino": { "type": "string" },
    "anoi": { "type": "string" }
  }
}

let profesorDB = {
	"minProperties": 4,
  "additionalProperties": true,
  "properties": {
    "nombres": { "type": "string" },
    "apellidos": { "type": "string" },
    "tipo": { 
    	"type": "string" ,
      "enum": ["peer", "titular"] 
    },
    "matricula": { "type": "string" }
  }
}

module.exports = {
  paralelos: {
    "type": "array",
    "items" : paralelo
  },
  paralelosSinTerminoAnio: {
    "type": "array",
    "items" : paraleloSinTerminoAnio
  },
  estudiantes: {
    "type": "array",
    "items" : estudiante
  },
  profesores: {
    "type": "array",
    "items" : profesor
  },
  profesor,
  estudiante,
  paralelo,
  estudiantesDB: {
		"type": "array",
    "items" : estudianteDB
	},
	paralelosDB: {
		"type": "array",
    "items" : paraleloDB
	},
	profesoresDB: {
		"type": "array",
    "items" : profesorDB
	}
}
