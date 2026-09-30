const allRoles = {
    user: ['updateProfile'],
    admin: ['getUsers', 'manageUsers', 'manageContent'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
    roles,
    roleRights,
};
