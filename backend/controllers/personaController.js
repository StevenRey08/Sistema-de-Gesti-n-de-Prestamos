const { prisma } = require('../db');
const logger = require('../utils/logger');
const { buildUniqueConstraintError } = require('../utils/prismaErrors');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const personaController = {
    getAll: async (req, res) => {
        const { search, tipo } = req.query;
        try {
            const where = { AND: [] };
            if (tipo) where.AND.push({ tipo: { equals: tipo, mode: 'insensitive' } });
            if (search) {
                where.AND.push({
                    OR: [
                        { nombres: { contains: search, mode: 'insensitive' } },
                        { apellidos: { contains: search, mode: 'insensitive' } },
                        { matricula: { contains: search, mode: 'insensitive' } }
                    ]
                });
            }
            if (where.AND.length === 0) delete where.AND;

            const personas = await prisma.persona.findMany({
                where,
                orderBy: { nombres: 'asc' }
            });
            res.json(personas);
        } catch (error) {
            logger.error("Error en personas.getAll:", error);
            res.status(500).json({ status: "error", mensaje: "Error al obtener personas" });
        }
    },

    create: async (req, res) => {
        try {
            const nueva = await prisma.persona.create({ data: req.body });
            res.status(201).json(nueva);
        } catch (error) {
            logger.error("Error en personas.create:", error);
            const duplicateError = buildUniqueConstraintError(error, {
                matricula: "Ya existe una persona registrada con esa matrícula.",
            }, "Ya existe un registro de persona con uno de los datos únicos ingresados.");
            if (duplicateError) return res.status(duplicateError.status).json(duplicateError.body);
            res.status(500).json({ status: "error", mensaje: "Error al crear persona" });
        }
    },

    getById: async (req, res) => {
        try {
            const persona = await prisma.persona.findUnique({ where: { id: req.params.id } });
            if (!persona) return res.status(404).json({ status: "error", mensaje: "Persona no encontrada" });
            res.json(persona);
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al buscar persona" });
        }
    },

    update: async (req, res) => {
        try {
            const actualizada = await prisma.persona.update({
                where: { id: req.params.id },
                data: req.body
            });
            res.json(actualizada);
        } catch (error) {
            const duplicateError = buildUniqueConstraintError(error, {
                matricula: "Ya existe una persona registrada con esa matrícula.",
            }, "Ya existe un registro de persona con uno de los datos únicos ingresados.");
            if (duplicateError) return res.status(duplicateError.status).json(duplicateError.body);
            res.status(500).json({ status: "error", mensaje: "Error al actualizar" });
        }
    },

    delete: async (req, res) => {
        try {
            await prisma.persona.delete({ where: { id: req.params.id } });
            res.json({ message: "Persona eliminada correctamente" });
        } catch (error) {
            res.status(500).json({ status: "error", mensaje: "Error al eliminar (puede que tenga préstamos asociados)" });
        }
    },

    deleteBulk: async (req, res) => {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ status: "error", mensaje: "Debe proporcionar un array de IDs" });
        }
        try {
            const tipo = req.query.tipo || 'ESTUDIANTE';
            const result = await prisma.persona.deleteMany({
                where: { id: { in: ids }, tipo: { equals: tipo, mode: 'insensitive' } }
            });
            res.json({ message: `${result.count} persona(s) eliminada(s) correctamente`, count: result.count });
        } catch (error) {
            logger.error("Error en personas.deleteBulk:", error);
            res.status(500).json({ status: "error", mensaje: "Error al eliminar personas" });
        }
    },

    deleteEstudiantes: async (req, res) => {
        try {
            const result = await prisma.persona.deleteMany({
                where: { tipo: { equals: 'ESTUDIANTE', mode: 'insensitive' } }
            });
            res.json({ message: `${result.count} estudiante(s) eliminado(s) correctamente`, count: result.count });
        } catch (error) {
            logger.error("Error en personas.deleteEstudiantes:", error);
            res.status(500).json({ status: "error", mensaje: "Error al eliminar estudiantes" });
        }
    },

    importExcel: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ status: "error", mensaje: "Debe subir un archivo Excel" });
            }

            const filePath = req.file.path;
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

            if (!data || data.length === 0) {
                fs.unlinkSync(filePath);
                return res.status(400).json({ status: "error", mensaje: "El archivo Excel está vacío" });
            }

            const resultados = { creados: 0, errores: [] };

            for (const row of data) {
                try {
                    const nombreCompleto = (row.nombre || row.Nombre || row.NOMBRE || '').trim();
                    const matricula = (row.matricula || row.Matricula || row.MATRÍCULA || row.MATRICULA || '').toString().trim();
                    const curso = (row.curso || row.Curso || row.CURSO || '').toString().trim();
                    const tipo = (row.tipo || row.Tipo || row.TIPO || 'ESTUDIANTE').toString().trim().toUpperCase();

                    if (!nombreCompleto || !matricula) {
                        resultados.errores.push({ fila: row, error: 'Faltan campos obligatorios (nombre, matrícula)' });
                        continue;
                    }

                    const partes = nombreCompleto.split(' ');
                    let nombres = '';
                    let apellidos = '';
                    if (partes.length >= 3) {
                        nombres = partes.slice(0, 2).join(' ');
                        apellidos = partes.slice(2).join(' ');
                    } else if (partes.length === 2) {
                        nombres = partes[0];
                        apellidos = partes[1];
                    } else {
                        nombres = partes[0];
                        apellidos = partes[0];
                    }

                    const existente = await prisma.persona.findUnique({ where: { matricula } });
                    if (existente) {
                        await prisma.persona.update({
                            where: { id: existente.id },
                            data: { nombres, apellidos, curso, tipo }
                        });
                    } else {
                        await prisma.persona.create({
                            data: { nombres, apellidos, matricula, curso, tipo }
                        });
                    }
                    resultados.creados++;
                } catch (err) {
                    resultados.errores.push({ fila: row, error: err.message });
                }
            }

            fs.unlinkSync(filePath);

            res.json({
                status: "ok",
                mensaje: `Procesados ${resultados.creados} registros. ${resultados.errores.length} errores.`,
                resultados
            });
        } catch (error) {
            logger.error("Error en personas.importExcel:", error);
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            res.status(500).json({ status: "error", mensaje: "Error al importar archivo Excel" });
        }
    }
};

module.exports = personaController;
