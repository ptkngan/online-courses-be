const { ErrorHandler } = require('../exceptions/error');
const db = require('../models');
const EnrollList = require('../models/enroll_list')(db.sequelize, db.Sequelize.DataTypes);
const STATUS = require('../enums/status.enum');

exports.GetEnrollCourseInfo = async function(courseId, userId){
    const result = await EnrollList.findOne({
        where:{
            courseId: courseId,
            createdBy: userId
        }
    });
    return result;
}

exports.EnrollCourses = async function(courseId, userId){
    const checkExist = await EnrollList.findOne({
        where:{
            courseId: courseId,
            createdBy: userId
        }
    });
    if (checkExist != null) throw new ErrorHandler(400, "User enrolled on this course");
    const enroll = {watching: 0, done: "[]", status: STATUS.active, courseId: courseId, createdBy: userId};
    const result = await EnrollList.create(enroll);
    return result;
}

exports.GetEnrollCourseInfo = async function (courseId, userId) {
    const enroll = await EnrollList.findOne(
        {
            where: {
                courseId: courseId,
                createdBy: userId
            }
        });
    if (enroll == null) throw new ErrorHandler(404, "User does not enroll on this course yet");
    return enroll;
}

exports.UpdateEnrollCourses = async function (enrollInfo) {
    const enroll = await EnrollList.findOne(
        {
            where: {
                courseId: enrollInfo.courseId,
                createdBy: enrollInfo.createdBy
            }
        }
    );
    if (enroll == null) throw new ErrorHandler(404, "User does not enroll on this course yet");
    if (enrollInfo.watching) enroll.watching = enrollInfo.watching;
    if (enrollInfo.done) enroll.done = enrollInfo.done;
    if (enrollInfo.status) enroll.status = enrollInfo.status;
    await enroll.save();
    return enroll;
}

exports.findOne = async function (whereObject) {
    return await EnrollList.findOne({ where: whereObject })
}