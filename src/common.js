const Enum = require('enum');
export const PERMISSIONS = new Enum([
    'BOT_OWNER',
    'SUPER_ADMIN',
    'ADMIN',
    'CAPTAIN',
    'USER'
]);

export const PERMISSIONS_ALL = PERMISSIONS.get(PERMISSIONS.enums.map(e => e.key).join(' | '));


export const CHANNEL = {
    DM: 0,
    PUBLIC: 1

};

export class PermissionStorage {
    _storage = {};

    update(id, permission) {
        this._storage[id] = permission;
    }

    exists(id) {
        return !!this._storage[id]

    }

    value(id) {
        return this._storage[id]
            ? this._storage[id] : this._storage[id] = PERMISSIONS.USER.value;

    }

    get(id) {
        return PERMISSIONS.get(this.value(id));
    }

    hasAny(id, permissions) {
        let current = this.get(id);
        return PermissionStorage.hasAny_(current, permissions)
    }

    static hasAny_(permission, permissions) {
        return hasAnyPermissions(permission, permissions);
    }
}


//PERMISSIONS.ADMINS = PERMISSIONS.get('BOT_OWNER | SUPER_ADMIN | ADMIN');
export const CHANNEL_BOTH = CHANNEL.DM | CHANNEL.PUBLIC;

function unique(a) {
    let lt = {},       // fast lookup table
        us = [],       // array of uniques
        l = a.length,  // cached length of original
        k;             // a key in the lookup table Object

    // build the lookup table, collapses duplicates automatically
    for (let i = 0; i < l; i++) lt[a[i]] = true;

    // unwind it
    for (k in lt) us.push(k);

    return us;
}
function extractEnumValue(e) {
    return `${e.toString()}`.split('|').map((name) => name.trim());
}
export function addPermissions(current, toAdd) {
    if (current.has(toAdd)) {
        return current;
    }

    let currentValue = extractEnumValue(current);

    let toAddValue = extractEnumValue(toAdd);

    let updated = unique([].concat(currentValue, toAddValue)).join(' | ');


    return PERMISSIONS.get(updated);
}
export function removePermissions(current, toRemove) {
    let currentValue = extractEnumValue(current);
    let toRemoveValue = extractEnumValue(toRemove);
    let updated = currentValue.filter((value) => {
        return !toRemoveValue.includes(value)
    }).join(' | ');


    return PERMISSIONS.get(updated);

}

export function hasAnyPermissions(current, toLookup) {
    return extractEnumValue(current).filter(e => toLookup.has(e)).length > 0;

}


export function createLogger(logger, banner) {
    function bind(type) {
        return function () {
            let parts = Array.prototype.slice.call(arguments);
            parts[0] = `[${banner}] ${parts[0]}`;

            logger[type].apply(logger, parts);

        }
    }

    return {
        debug: bind('debug'),
        info: bind('info'),
        warning: bind('warning'),

        error: bind('error')
    }
}
