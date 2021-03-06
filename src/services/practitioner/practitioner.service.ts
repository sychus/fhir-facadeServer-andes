import { ServerError, resolveSchema } from '@asymmetrik/node-fhir-server-core';
import { Practitioner as fhirPractitioner } from '@andes/fhir';
import { stringQueryBuilder, tokenQueryBuilder } from './../../utils/querybuilder.util';
import { setObjectId as objectId } from './../../utils/uid.util';
const ObjectID = require('mongodb').ObjectID

const { CONSTANTS } = require('./../../constants');
const globals = require('../../globals');

let getPractitioner = (base_version) => {
	return resolveSchema(base_version, 'Practitioner');
};

let buildAndesSearchQuery = (args) => {
	// Filtros de búsqueda para profesionales
	let id = args['id'];
	let active = args['active'];
	let family = args['family'];
	let given = args['given'];
	let identifier = args['identifier'];
	// Con este filtro evitamos las búsquedas de los que no son matriculados y están en la misma colección
	let query: any = {profesionalMatriculado: {$eq: true}};
	if (id) {
		query.id = id;
	}
	if (active) {
		query.activo = active === true ? true : false;
	}
	if (family) {
		query.apellido = stringQueryBuilder(family);
	}
	if (given) {
		query.nombre = stringQueryBuilder(given);
	}
	// controles de identifier de profesional
	if (identifier) {
		let tokenBuilder: any = tokenQueryBuilder(identifier, 'value', 'identifier', false);
		switch (tokenBuilder.system) {
			case 'andes.gob.ar': 
			    query._id = new ObjectID(tokenBuilder.value);
			    break;
			case 'https://seti.afip.gob.ar/padron-puc-constancia-internet/ConsultaConstanciaAction.do':
			    query.cuit = tokenBuilder.value;
			    break;
			case 'http://www.renaper.gob.ar/dni':
				query.documento = tokenBuilder.value;
				break;
			default:
				query.documento = tokenBuilder.value;
			    }
	}
	return query;
};


export = {
	search: async (args, context) => {
		try {
			let { base_version } = args;
			if (Object.keys(args).length > 1) {
				let query = buildAndesSearchQuery(args);
				const db = globals.get(CONSTANTS.CLIENT_DB);
				let collection = db.collection(`${CONSTANTS.COLLECTION.PRACTITIONER}`)
				let Practitioner = getPractitioner(base_version);
				let practitioners = await collection.find(query).toArray();
				return practitioners.map(prac => new Practitioner(fhirPractitioner.encode(prac)));
			} else {
				throw {warning: 'You will need to add the search parameters'};
			}
		} catch (err) {
			let message, system, code = '';
			if (typeof err === 'object') {
				message = err.message;
				system = err.system;
				code = err.code
			} else {
				message = err
			}
			throw new ServerError(message, {
				resourceType: "OperationOutcome",
				issue: [
						{
							severity: 'error',
							code,
							diagnostics: message
						}
					]
			  });
	
		}
	},
	searchById: async (args, context) => {
		try {
			let { base_version, id } = args;
			let Practitioner = getPractitioner(base_version);
			let db = globals.get(CONSTANTS.CLIENT_DB);
			let collection = db.collection(`${CONSTANTS.COLLECTION.PRACTITIONER}`);
			let practitioner = await collection.findOne({ _id: objectId(id) });
			return practitioner ? new Practitioner(fhirPractitioner.encode(practitioner)) : { notFound: 404 };
		} catch (err) {
			let message, system, code = '';
			if (typeof err === 'object') {
				message = err.message;
				system = err.system;
				code = err.code
			} else {
				message = err
			}
			throw new ServerError(message, {
				resourceType: "OperationOutcome",
				issue: [
						{
							severity: 'error',
							code,
							diagnostics: message
						}
					]
			  });
	
		}
	}

};





