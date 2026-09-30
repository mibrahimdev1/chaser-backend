const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { groupService } = require('../services');
const pick = require('../utils/pick');

/**
 * Create a new group
 */
const createGroup = catchAsync(async (req, res) => {
    const group = await groupService.createGroup(req.body, req.user.id);
    res.status(httpStatus.CREATED).send({ group });
});

/**
 * Update a group by ID
 */
const updateGroup = catchAsync(async (req, res) => {
    const { groupId } = req.params;
    const updateData = req.body;
    const group = await groupService.updateGroup(groupId, updateData);
    res.status(httpStatus.OK).send(group);
});

/**
 * Delete a group by ID
 */
const deleteGroup = catchAsync(async (req, res) => {
    const { groupId } = req.params;
    await groupService.deleteGroup(groupId);
    res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Get a group by ID
 */
const getGroupById = catchAsync(async (req, res) => {
    const { groupId } = req.params;
    const group = await groupService.getGroupById(groupId);
    res.status(httpStatus.OK).send(group);
});

/**
 * Add a member to a group (creates an invitation)
 */
const addMemberToGroup = catchAsync(async (req, res) => {
    const { groupId, userId } = req.params;
    const invitation = await groupService.addMemberToGroup(groupId, userId, req.user.id);
    res.status(httpStatus.OK).send({ invitation });
});

/**
 * Remove a member from a group
 */
const removeMemberFromGroup = catchAsync(async (req, res) => {
    const { groupId, userId } = req.params;
    const group = await groupService.removeMemberFromGroup(groupId, userId);
    res.status(httpStatus.OK).send(group);
});

/**
 * Add an admin to a group
 */
const addAdminToGroup = catchAsync(async (req, res) => {
    const { groupId, userId } = req.params;
    const group = await groupService.addAdminToGroup(groupId, userId);
    res.status(httpStatus.OK).send(group);
});

/**
 * Remove an admin from a group
 */
const removeAdminFromGroup = catchAsync(async (req, res) => {
    const { groupId, userId } = req.params;
    const group = await groupService.removeAdminFromGroup(groupId, userId);
    res.status(httpStatus.OK).send(group);
});

/**
 * Get all groups (with pagination)
 */
const getAllGroups = catchAsync(async (req, res) => {
    const options = pick(req.query, ['limit', 'page', 'forUser']);
    const { forUser } = options;

    // If forUser is true, filter groups where user is a member or admin
    const filters = {};
    if (forUser) {
        filters.$or = [{ members: req.user.id }, { admins: req.user.id }];
    }

    const groups = await groupService.getAllGroups(filters, options);
    res.status(httpStatus.OK).send(groups);
});

/**
 * Search groups by name or description
 */
const searchGroups = catchAsync(async (req, res) => {
    const { query } = req.query;
    const { page = 1, limit = 10, myGroups = false, publicGroups = false } = req.query;
    const userId = req.user.id;

    // Convert string booleans to actual booleans
    const myGroupsFilter = myGroups === 'true' || myGroups === true;
    const publicGroupsFilter = publicGroups === 'true' || publicGroups === true;

    const groups = await groupService.searchGroups(query, page, limit, userId, myGroupsFilter, publicGroupsFilter);
    res.status(httpStatus.OK).send(groups);
});

/**
 * Join a public group
 */
const joinGroup = catchAsync(async (req, res) => {
    const { groupId } = req.params;
    const group = await groupService.joinGroup(groupId, req.user.id);
    res.status(httpStatus.OK).send({ group });
});

/**
 * Leave a group
 */
const leaveGroup = catchAsync(async (req, res) => {
    const { groupId } = req.params;
    const group = await groupService.leaveGroup(groupId, req.user.id);
    res.status(httpStatus.OK).send({ group });
});

module.exports = {
    createGroup,
    updateGroup,
    deleteGroup,
    getGroupById,
    addMemberToGroup,
    removeMemberFromGroup,
    addAdminToGroup,
    removeAdminFromGroup,
    getAllGroups,
    searchGroups,
    joinGroup,
    leaveGroup,
};
