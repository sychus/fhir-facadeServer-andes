"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filtrarRegistros = exports.getPrestaciones = void 0;
const constants_1 = require("./../../constants");
const globals = require('../../globals');
var moment = require('moment');
function getPrestaciones(paciente, { estado = 'validada', desde = null, hasta = null }) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = globals.get(constants_1.CONSTANTS.CLIENT_DB);
        let collection = db.collection(`${constants_1.CONSTANTS.COLLECTION.PRESTATIONS}`);
        const query = {
            'paciente.id': paciente._id,
            $where: `this.estados[this.estados.length - 1].tipo ==  "${estado}"`
        };
        if (desde || hasta) {
            query['ejecucion.fecha'] = {};
            if (desde) {
                query['ejecucion.fecha']['$gte'] = moment(desde).startOf('day').toDate();
            }
            if (hasta) {
                query['ejecucion.fecha']['$lte'] = moment(hasta).endOf('day').toDate();
            }
        }
        return yield collection.find(query).toArray();
    });
}
exports.getPrestaciones = getPrestaciones;
function filtrarRegistros(prestaciones, { semanticTags }, snomedAlergias) {
    let registrosMedicos = [];
    let prestacionMedicamentos = [];
    let registrosAlergias = [];
    // Busco los descenientes de las alergias a sustancias
    prestaciones.forEach(prestacion => {
        prestacion.ejecucion.registros.forEach(registro => {
            if (registro.concepto.semanticTag === 'producto' || registro.concepto.semanticTag === 'fármaco de uso clínico') {
                prestacionMedicamentos = [...prestacionMedicamentos, registro];
            }
            else {
                const alergia = snomedAlergias.find(al => al.conceptId === registro.concepto.conceptId);
                const semTag = registro.concepto.semanticTag;
                const exist = semanticTags.find(el => el === semTag);
                if (alergia) {
                    registrosAlergias = [...registrosAlergias, registro];
                }
                else if (exist) {
                    registrosMedicos = [...registrosMedicos, registro];
                }
            }
        });
    });
    return { registrosMedicos, prestacionMedicamentos, registrosAlergias };
}
exports.filtrarRegistros = filtrarRegistros;
//# sourceMappingURL=prestaciones.js.map