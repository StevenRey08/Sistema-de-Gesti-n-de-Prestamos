const { prisma } = require('../db');
const logger = require('../utils/logger');
const { buildUniqueConstraintError } = require('../utils/prismaErrors');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const personaController = {
    getAll: async (req, res) => {
        const { search, tipo, curso, seccion } = req.query;
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
            if (curso) {
                where.AND.push({ curso: { startsWith: curso, mode: 'insensitive' } });
            }
            if (seccion) {
                where.AND.push({ curso: { endsWith: seccion, mode: 'insensitive' } });
            }
            if (where.AND.length === 0) delete where.AND;

            const personas = await prisma.persona.findMany({
                where,
                include: {
                    _count: {
                        select: {
                            prestamos_estudiante: {
                                where: { estado: { in: ['ACTIVO', 'PENDIENTE', 'VENCIDO'] } }
                            },
                            prestamos_instructor: {
                                where: { estado: { in: ['ACTIVO', 'PENDIENTE', 'VENCIDO'] } }
                            }
                        }
                    }
                },
                orderBy: { nombres: 'asc' }
            });
            const resultado = personas.map(p => ({
                ...p,
                prestamosActivos: p._count.prestamos_estudiante + p._count.prestamos_instructor
            }));
            res.json(resultado);
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
            const estudiantes = await prisma.persona.findMany({
                where: { tipo: { equals: 'ESTUDIANTE', mode: 'insensitive' } },
                include: {
                    _count: {
                        select: {
                            prestamos_estudiante: {
                                where: { estado: { in: ['ACTIVO', 'PENDIENTE', 'VENCIDO'] } }
                            }
                        }
                    }
                }
            });

            const sinPrestamos = estudiantes.filter(e => e._count.prestamos_estudiante === 0);
            const conPrestamos = estudiantes.filter(e => e._count.prestamos_estudiante > 0);

            if (sinPrestamos.length > 0) {
                await prisma.persona.deleteMany({
                    where: { id: { in: sinPrestamos.map(e => e.id) } }
                });
            }

            res.json({
                message: `${sinPrestamos.length} estudiante(s) eliminado(s). ${conPrestamos.length} estudiante(s) no se eliminaron porque tienen préstamos activos.`,
                eliminados: sinPrestamos.length,
                omitidos: conPrestamos.length
            });
        } catch (error) {
            logger.error("Error en personas.deleteEstudiantes:", error);
            res.status(500).json({ status: "error", mensaje: "Error al eliminar estudiantes" });
        }
    },

    downloadTemplate: async (req, res) => {
        try {
            const wb = XLSX.utils.book_new();

            const estudiantesData = [
                { MATRICULA: '2024-0001', NOMBRES: 'Juan', APELLIDOS: 'Pérez', CURSO: '5to', SECCION: 'A' },
                { MATRICULA: '2024-0002', NOMBRES: 'María', APELLIDOS: 'García', CURSO: '6to', SECCION: 'B' },
            ];
            const wsEstudiantes = XLSX.utils.json_to_sheet(estudiantesData);
            wsEstudiantes['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 8 }, { wch: 10 }];
            XLSX.utils.book_append_sheet(wb, wsEstudiantes, 'ESTUDIANTES');

            const docentesData = [
                { DNI: '000-0000000-0', NOMBRES: 'Roberto', APELLIDOS: 'Martínez' },
                { DNI: '000-0000000-1', NOMBRES: 'Ana', APELLIDOS: 'López' },
            ];
            const wsDocentes = XLSX.utils.json_to_sheet(docentesData);
            wsDocentes['!cols'] = [{ wch: 16 }, { wch: 20 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, wsDocentes, 'DOCENTES');

            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Disposition', 'attachment; filename="plantilla_personas.xlsx"');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
        } catch (error) {
            logger.error("Error en personas.downloadTemplate:", error);
            res.status(500).json({ status: "error", mensaje: "Error al generar plantilla" });
        }
    },

    importExcel: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ status: "error", mensaje: "Debe subir un archivo Excel" });
            }

            const filePath = req.file.path;
            const workbook = XLSX.readFile(filePath);
            const resultados = { creados: 0, actualizados: 0, errores: [] };

            for (const sheetName of workbook.SheetNames) {
                const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
                if (!data || data.length === 0) continue;

                const esEstudiantes = sheetName.toUpperCase().includes('ESTUDIANTE');

                for (const row of data) {
                    try {
                        let nombres = '';
                        let apellidos = '';
                        let matricula = '';
                        let tipo = '';
                        let curso = '';

                        if (esEstudiantes) {
                            matricula = (row.MATRICULA || row.Matricula || row.matricula || '').toString().trim();
                            nombres = (row.NOMBRES || row.Nombres || row.nombres || row.NOMBRE || row.Nombre || row.nombre || '').toString().trim();
                            apellidos = (row.APELLIDOS || row.Apellidos || row.apellidos || row.APELLIDO || row.Apellido || row.apellido || '').toString().trim();
                            const cursoVal = (row.CURSO || row.Curso || row.curso || '').toString().trim();
                            const seccionVal = (row.SECCION || row.Seccion || row.seccion || '').toString().trim();
                            if (cursoVal || seccionVal) {
                                curso = `${cursoVal} ${seccionVal}`.trim();
                            }
                            tipo = 'ESTUDIANTE';
                        } else {
                            matricula = (row.DNI || row.Dni || row.dni || '').toString().trim();
                            nombres = (row.NOMBRES || row.Nombres || row.nombres || row.NOMBRE || row.Nombre || row.nombre || '').toString().trim();
                            apellidos = (row.APELLIDOS || row.Apellidos || row.apellidos || row.APELLIDO || row.Apellido || row.apellido || '').toString().trim();
                            tipo = (row.TIPO || row.Tipo || row.tipo || 'PROFESOR').toString().trim().toUpperCase();
                        }

                        if (!nombres || !apellidos || !matricula) {
                            resultados.errores.push({ fila: row, error: 'Faltan campos obligatorios' });
                            continue;
                        }

                        const existente = await prisma.persona.findUnique({ where: { matricula } });
                        if (existente) {
                            await prisma.persona.update({
                                where: { id: existente.id },
                                data: { nombres, apellidos, curso: curso || undefined, tipo }
                            });
                            resultados.actualizados++;
                        } else {
                            await prisma.persona.create({
                                data: { nombres, apellidos, matricula, curso: curso || undefined, tipo }
                            });
                            resultados.creados++;
                        }
                    } catch (err) {
                        resultados.errores.push({ fila: row, error: err.message });
                    }
                }
            }

            fs.unlinkSync(filePath);

            res.json({
                status: "ok",
                mensaje: `Creados: ${resultados.creados}, Actualizados: ${resultados.actualizados}, Errores: ${resultados.errores.length}`,
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
