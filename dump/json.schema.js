module.exports = {
  profesores: {
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
  },
  estudiantes: {
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
  },
  paralelos: {
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
}
