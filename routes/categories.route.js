const express = require('express');
const router = express.Router();
const catSchema = require('../schemas/category.json');
const categoryService = require('../services/category.service');
const courseService = require('../services/course.service');
const { Response, PageResponse } = require('../response/response');
const { ErrorHandler } = require('../exceptions/error');
const STATUS = require('../enums/status.enum');
const USER_TYPE = require('../enums/user-type.enum');
const getQuerySchema = require('../schemas/getQuery');

const {
    getPutSchema,
    getLimitQuery,
    getPageQuery,
} = require('../utils');

const validateAuth = require('../middlewares/auth.mdw');
const validateRoles = require('../middlewares/auth.roles.mdw');
const validateGetQuery = require('../middlewares/validateGetQuery.mdw');
const validateSchema = require('../middlewares/validate.mdw');

router.post('/',
    validateAuth,
    validateRoles([USER_TYPE.admin]),
    validateSchema(catSchema),
    async function (req, res, next) {
        try {
            const payload = req.accessTokenPayload;
            const entity = req.body;

            const duplicate = await categoryService.findOne({ category_name: entity.category_name, status: STATUS.active });
            if (duplicate) {
                throw new ErrorHandler(400, "Category existed.");
            }

            if (entity.parentId) {
                const check = await categoryService.findOne({ id: entity.parentId, status: STATUS.active });
                if (!check) {
                    throw new ErrorHandler(404, "Parent category is not existed.");
                }
            }

            entity.createdBy = payload.userId;
            entity.status = STATUS.active;
            entity.number_enrolled = 0;

            const result = await categoryService.create(entity);
            res.status(201).json(new Response(null, true, result));
        } catch (error) {
            next(error);
        }
    }
);

router.get('/', validateGetQuery(getQuerySchema), async function (req, res, next) {
    try {
        let { page, limit } = req.query;
        page = getPageQuery(page);
        limit = getLimitQuery(limit);
        const result = await categoryService.findAll(page, limit);
        res.status(200).json(new PageResponse(null, true, result, page, limit));
    } catch (error) {
        next(error);
    }
});

router.get('/most-enroll-this-week', async function (req, res, next) {
    try {
        const result = await categoryService.findMostEnrollInWeek();
        res.status(200).json(new Response(null, true, result));
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async function (req, res, next) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id < 1) {
            throw new ErrorHandler(400, "Invalid Id.");
        }
        const result = await categoryService.findOne({ id });
        res.status(200).json(new Response(null, true, result));
    } catch (error) {
        next(error);
    }
});




router.put('/',
    validateAuth,
    validateRoles([USER_TYPE.admin]),
    validateSchema(getPutSchema(catSchema)),
    async function (req, res, next) {
        try {
            const payload = req.accessTokenPayload;
            const currentUser = { userId: payload.userId };

            const entity = req.body;
            const id = entity.id;

            const dbEntity = await categoryService.findOne({ id, status: STATUS.active });
            if (!dbEntity) {
                throw new ErrorHandler(404, "Not exist entity");
            }

            if (entity.parentId) {
                const check = await categoryService.findOne({ id: entity.parentId, status: STATUS.active });
                if (!check) {
                    throw new ErrorHandler(404, "Parent category is not existed.");
                }
            }

            const result = await categoryService.update(dbEntity, {
                category_name: entity.category_name,
                updatedBy: currentUser.userId
            });
            res.status(200).json(new Response(null, true, result));
        } catch (error) {
            next(error);
        }
    }
);

router.delete('/:id',
    validateAuth,
    validateRoles([USER_TYPE.admin]),
    async function (req, res, next) {
        try {
            const payload = req.accessTokenPayload;
            const currentUser = { userId: payload.userId };

            const id = parseInt(req.params.id);

            if (isNaN(id) || id < 1) {
                throw new ErrorHandler(400, "Invalid Id.");
            }

            const dbEntity = await categoryService.findOne({ id });

            if (dbEntity === null) {
                throw new ErrorHandler(404, "Category is not existed.");
            }

            if (dbEntity.categories.length > 0) {
                throw new ErrorHandler(400, "Delete child category first.");
            }

            const existCourse = await courseService.findOne({
                categoryId: id,
                status: STATUS.active
            });

            if (existCourse !== null) {
                throw new ErrorHandler(404, "Course existed");
            }

            const result = await categoryService.update(dbEntity, {
                status: STATUS.deleted,
                updatedBy: currentUser.userId
            });
            res.status(200).json(new Response(null, true, null));
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;