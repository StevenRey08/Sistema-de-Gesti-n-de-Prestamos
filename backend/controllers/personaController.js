const { prisma } = require('../db');
const logger = require('../utils/logger');
const { buildUniqueConstraintError } = require('../utils/prismaErrors');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const personaController = {
    getAll: async (req, res) => {
        const { search, tipo, curso, seccion, incluirInactivos } = req.query;
        try {
            const where = { AND: [] };
            if (incluirInactivos !== 'true') {
                where.AND.push({ activo: true });
            }
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
        return res.status(405).json({ status: "error", mensaje: "No se pueden eliminar personas de forma individual. Use 'Dar de baja' en su lugar." });
    },

    deleteBulk: async (req, res) => {
        return res.status(405).json({ status: "error", mensaje: "No se pueden eliminar personas en lote de esta forma." });
    },

    debaja: async (req, res) => {
        try {
            const persona = await prisma.persona.findUnique({
                where: { id: req.params.id },
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
                }
            });
            if (!persona) return res.status(404).json({ status: "error", mensaje: "Persona no encontrada" });

            const prestamosActivos = persona._count.prestamos_estudiante + persona._count.prestamos_instructor;
            if (prestamosActivos > 0) {
                return res.status(400).json({
                    status: "error",
                    mensaje: `No se puede dar de baja a "${persona.nombres} ${persona.apellidos}" porque tiene ${prestamosActivos} préstamo(s) pendiente(s).`
                });
            }

            const usuarioId = req.usuario?.id;

            await prisma.personaHistorico.create({
                data: {
                    persona_id: persona.id,
                    matricula: persona.matricula,
                    nombres: persona.nombres,
                    apellidos: persona.apellidos,
                    tipo: persona.tipo,
                    curso: persona.curso,
                    telefono: persona.telefono,
                    usuario_id_baja: usuarioId,
                }
            });

            await prisma.persona.update({
                where: { id: req.params.id },
                data: { activo: false }
            });
            res.json({ message: "Persona dada de baja correctamente" });
        } catch (error) {
            logger.error("Error en personas.debaja:", error);
            res.status(500).json({ status: "error", mensaje: "Error al dar de baja" });
        }
    },

    debajaEstudiantes: async (req, res) => {
        try {
            const estudiantes = await prisma.persona.findMany({
                where: { tipo: { equals: 'ESTUDIANTE', mode: 'insensitive' }, activo: true },
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
                }
            });

            const aHistorico = [];
            const aEliminar = [];
            const conPrestamos = [];

            for (const est of estudiantes) {
                const curso = (est.curso || '').toUpperCase();
                const tienePrestamos = est._count.prestamos_estudiante > 0 || est._count.prestamos_instructor > 0;

                if (tienePrestamos) {
                    conPrestamos.push(est);
                    continue;
                }

                if (curso.startsWith('6TO')) {
                    aHistorico.push(est);
                } else {
                    aEliminar.push(est);
                }
            }

            const usuarioId = req.usuario?.id;

            if (aHistorico.length > 0) {
                for (const est of aHistorico) {
                    await prisma.personaHistorico.create({
                        data: {
                            persona_id: est.id,
                            matricula: est.matricula,
                            nombres: est.nombres,
                            apellidos: est.apellidos,
                            tipo: est.tipo,
                            curso: est.curso,
                            telefono: est.telefono,
                            usuario_id_baja: usuarioId,
                        }
                    });
                }
                await prisma.persona.updateMany({
                    where: { id: { in: aHistorico.map(e => e.id) } },
                    data: { activo: false }
                });
            }

            if (aEliminar.length > 0) {
                const ids = aEliminar.map(e => e.id);

                await prisma.movimiento.updateMany({
                    where: { persona_id: { in: ids } },
                    data: { persona_id: null }
                });

                await prisma.prestamo.updateMany({
                    where: { persona_id: { in: ids } },
                    data: { persona_id: null }
                });

                await prisma.prestamo.updateMany({
                    where: { instructor_id: { in: ids } },
                    data: { instructor_id: null }
                });

                await prisma.persona.deleteMany({
                    where: { id: { in: ids } }
                });
            }

            res.json({
                message: `${aHistorico.length} estudiante(s) de 6to pasado(s) a histórico. ${aEliminar.length} estudiante(s) de 4to/5to eliminado(s). ${conPrestamos.length} estudiante(s) no se movieron por tener préstamos activos.`,
                pasadosHistorico: aHistorico.length,
                eliminados: aEliminar.length,
                omitidos: conPrestamos.length
            });
        } catch (error) {
            logger.error("Error en personas.debajaEstudiantes:", error);
            res.status(500).json({ status: "error", mensaje: "Error al dar de baja estudiantes" });
        }
    },

    getHistorico: async (req, res) => {
        try {
            const { search } = req.query;
            const where = {};
            if (search) {
                where.OR = [
                    { nombres: { contains: search, mode: 'insensitive' } },
                    { apellidos: { contains: search, mode: 'insensitive' } },
                    { matricula: { contains: search, mode: 'insensitive' } },
                ];
            }
            const historico = await prisma.personaHistorico.findMany({
                where,
                include: {
                    usuario_baja: {
                        select: { id: true, nombre: true, apellido: true, usuario: true }
                    }
                },
                orderBy: { fecha_baja: 'desc' }
            });
            res.json(historico);
        } catch (error) {
            logger.error("Error en personas.getHistorico:", error);
            res.status(500).json({ status: "error", mensaje: "Error al obtener historial" });
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
                                data: { nombres, apellidos, curso: curso || undefined, tipo, activo: true }
                            });
                            await prisma.personaHistorico.deleteMany({
                                where: { persona_id: existente.id }
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
