const Enum = require('enum');
export const PERMISSIONS = new Enum([
    'BOT_OWNER',
    'SUPER_ADMIN',
    'ADMIN',
    'CAPTAIN',
    'USER'
]);


export const CHANNEL = {
    DM: 0,
    PUBLIC: 1

};


PERMISSIONS.ADMINS = PERMISSIONS.get('BOT_OWNER | SUPER_ADMIN | ADMIN');
CHANNEL.BOTH = CHANNEL.DM | CHANNEL.PUBLIC;