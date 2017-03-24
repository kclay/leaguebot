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


//PERMISSIONS.ADMINS = PERMISSIONS.get('BOT_OWNER | SUPER_ADMIN | ADMIN');
//CHANNEL.BOTH = CHANNEL.DM | CHANNEL.PUBLIC;

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
