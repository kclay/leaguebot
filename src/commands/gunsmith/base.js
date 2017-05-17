import BaseCommand from "../base";
const Promise = require('bluebird');
const _ = require('lodash');
const {DataHelper} = require('./bungie-data-helper');
const request = require('request');
const constants = require('./showoff-constants')
//request.debug = true;
const SHOW_ARMOR = true;


function GunsmithError(message, extra) {

    this.name = this.constructor.name;
    this.message = message;
    this.extra = extra;
    Error.captureStackTrace(this, this.constructor);
}
require('util').inherits(GunsmithError, Error);
export default class GunsmithBaseCommand extends BaseCommand {


    dataHelper = new DataHelper();
    vendorItemTypes = [
        {
            'Auto Rifle': [
                'auto',
                'rifle'
            ],
            'Scout Rifle': [
                'scout'
            ],
            'Shotgun': [
                'shotgun'
            ],
            'Sniper Rifle': [
                'sniper'
            ],
            'Fusion Rifle': [
                'fusion'
            ],
            'Rocket Launcher': [
                'rocket',
                'launcher'
            ],

        }
    ];

    constructor(robot) {
        super(robot, 'gunsmith.root')
    }


    init() {
        this.xbox = ['xbox', 'xb1', 'xbox1', 'xboxone', 'xbox360', 'xb360', 'xbone', 'xb'];
        this.playstation = ['psn', 'playstation', 'ps', 'ps3', 'ps4', 'playstation3', 'playstation4'];
        this.log.debug('xbox = %j', this.xbox);
        this.slots = 'primary|special|secondary|heavy|ghost|head|helm|helmet|chest|arm|arms|';
        this.slots += 'gloves|gauntlets|leg|legs|boots|class|mark|bond|cape|cloak';


        let networks = [].concat(this.xbox, this.playstation).join('|');
        let lookupPattern = '\\s*(?<network>' + networks
            + ')?\\s*@?(?<name>[\\[\\]\\d\\w\\s]+)?\\s+(?<bucket>' + this.slots + ')';

        let vendorPattern = '\\s*(?<weekly>weekly)?\\s*(?<vendor_type>warlock|titan|hunter)?\\s*';
        this.slots += 'scout|hc|handcannon|shotgun|sniper|fusion|lmg|machine|rocket';
        vendorPattern += '(?<vendor_name>\\w+)\\s*(?<bucket>' + this.slots + ')?';

        this._pattern = lookupPattern;


        super.init();
    }


    _createPatterns() {
        let patterns = super._createPatterns();
        patterns.public = patterns.public.replace('!league ', '!');
        patterns.flags = 'i';
        return patterns;
    }

    _isSlot(value) {
        return ['primary', 'heavy', 'special', 'secondary'].includes(value)
    }


    async _handleCharacterLookup(resp) {
        let {network, name, bucket} = resp.match.groups;
        let user = this.userResolve(resp);
        if (!user && name) {
            user = this.userResolve(name);
            if (user) name = user.name;
        }
        if (user && !name) {
            name = user.name;
        }


        this.log.debug('User = %j Name = %s', user, name);


        let membershipType = !network ? this._parseNetwork(name) : this._resolveNetworkType(network);
        name = this._parseName(name);

        let player, characterId, itemId, details;
        try {
            player = await
                this._resolveId(membershipType, name);
        } catch (e) {
            let nickname = resp.envelope.user.nickname;

            if (nickname) {

                membershipType = this._parseNetwork(nickname);
                name = this._parseName(nickname);
                try {
                    player = await
                        this._resolveId(membershipType, name);
                    e = null;
                } catch (e2) {
                    e = e2;
                }

            }
            if (e)
                return this._handleError(resp, e)
        }

        this.log.debug('player %j', player);

        try {
            characterId = await
                this._getCharacterId(player.platform, player.id)
        } catch (e) {
            return this._handleError(resp, e)
        }


        try {
            itemId = await  this._getItemIdFromSummary(
                player.platform, player.id,
                characterId, this._getBucket(bucket))
        } catch (e) {
            return this._handleError(resp, e)
        }

        try {
            details = await this._getItemDetails(
                player.platform, player.id, characterId, itemId);
        } catch (e) {
            return this._handleError(resp, e)
        }

        let message = this.dataHelper.parsePayload(details);

        return resp.send(message)
    }

    _resolveVendorName(value) {
        value = (value || '').toLowerCase();
        switch (value) {
            case 'vanguard':
                return 'VANGUARD';
            case 'do':
            case 'orbit':
            case 'dead orbit':
                return 'DEAD_ORBIT';
            case 'future':
            case 'war':
            case 'cult':
            case 'fwc':
                return 'FWC';
            case 'nm':
            case 'new':
            case 'monarchy':
            case 'monarch':
                return 'NEW_MONARCHY';
            case 'pvp':
            case 'crucible':
                return 'CRUCIBLE';
            default:
                return null;
        }
    }

    _resolveVendorType(value) {
        value = (value || '').toLowerCase();
        switch (value) {
            case 'titan':
                return 'TITAN';
            case 'hunter':
                return 'HUNTER';
            case 'warlock':
                return 'WARLOCK';
            default:
                return null;

        }
    }

    _isItemTypeLookup(value) {
        switch (value) {
            case 'hc':
            case 'handcannon':
            case 'cannon':
                return 'Hand Cannon';
            case 'scout':
                return 'Scout Rifle';
            case 'auto':
                return 'Auto Rifle';
            case 'pulse':
                return 'Pulse Rifle';
            case 'shotgun':
                return 'Shotgun';
            case'lmg':
            case 'machine':
                return 'Machine Gun';
            case 'sidearm':
            case 'pewpew':
                return 'Sidearm';
            case 'sniper':
                return 'Sniper Rifle';
            case 'fusion':
            case 'voop':
                return 'Fusion Rifle';
            case 'rocket':
            case 'launcher':
                return 'Rocket Launcher';
        }
    }

    async _handleVendorLookup(resp) {
        let {vendor_type, vendor_name, bucket} = resp.match.groups;

        let vendorId;
        vendor_name = this._resolveVendorName(vendor_name);
        vendor_type = this._resolveVendorType(vendor_type);
        if (vendor_type) {
            let type = constants.VENDORS[vendor_type];
            if (type && type[vendor_name]) {
                vendorId = type[vendor_name];
            }
        }
        if (!vendorId && constants.VENDORS[vendor_name]) {
            vendorId = constants.VENDORS[vendor_name];
        }

        if (!vendorId) {
            return resp.send(this.text.error.add('Invalid vendor')._)
        }

        let vendorInfo;
        try {
            vendorInfo = this._getVendorItemDetails(vendorId);
        } catch (e) {

        }
        let definitions = vendorInfo.definitions;

        let bucketId = this._getBucket(bucket);
        let itemTypeName;
        if (!bucketId) {

            itemTypeName = this._isItemTypeLookup(value);
            if (!itemTypeName) {
                return resp.send(this.text.error.add('Invalid bucket should be one of the following')
                    .bold(this.slots.split('|').join(',')))
            }
        }

        let sales = definitions.items;
        console.log(sales);


        let itemInfos = _.filter(_.values(sales), info => {
            if (bucketId)return info.bucketHash === bucketId;
            return info.itemTypeName === itemTypeName;

        })
        let messages = _.map(itemInfos, info => {
            return this.dataHelper.serializeFromVendor(info, definitions)
        })
    }

    async _handle(resp) {
        let {weekly, type, vendor_name} = resp.match.groups;

        if (weekly || type || vendor_name) {
            return this._handleVendorLookup(resp);
        }
        return this._handleCharacterLookup(resp);


    }

    _handleError(resp, e) {
        this.log.error(e.stack || e);
        resp.envelope.room = resp.envelope.user.id;
        return resp.send(this.text.error
            .add(e.message).e)
    }

    _parseName(name) {
        return (name.split('[')[0] || '').replace(']', '').trim();

    }

    _parseNetwork(name) {
        let parts = name.split('[');
        if (parts.length > 1) {
            let network = parts[1].replace(']', '').trim();
            this.log.debug('network = %s', network);
            network = network.toLowerCase().trim();
            return this._resolveNetworkType(network);
        }
        return null;


    }

    _resolveNetworkType(network) {
        network = network.toLowerCase();
        if (this.xbox.includes(network)) return 1;
        if (this.playstation.includes(network)) return 2;
        return null;
    }

    async _resolveId(membershipType, name) {
        this.log.debug(membershipType, name);
        if (membershipType) {
            return this._getPlayerId(membershipType, name)
        }
        return Promise.all([
            this._getPlayerId(1, name.split('_').join(' ')),
            this._getPlayerId(2, name)
        ]).then(results => {
            if (results[0] && results[1]) {
                throw new GunsmithError(`Mutiple platforms found for: ${name}. use "xbox" or "playstation`);
            }
            if (results[0]) {
                return results[0]
            } else if (results[1]) {
                return results[1]
            }
            throw new GunsmithError(`Could not find guardian with name: ${name} on either platform.`)
        })
    }

    async _getPlayerId(membershipType, name) {
        const endpoint = `SearchDestinyPlayer/${membershipType}/${name}`;
        let networkName = membershipType === 1 ? 'xbox' : 'psn';
        return this.api(endpoint)
            .then(resp => {
                if (!resp) throw new GunsmithError(`Could not find guardian with name: ${name} on ${networkName}.`)
                let [data] = resp;
                return data && data.membershipId ? {
                    platform: membershipType,
                    id: data.membershipId
                } : null

            })
    }

    async _getCharacterId(membershipType, playerId) {
        const endpoint = `${membershipType}/Account/${playerId}`;
        return this.api(endpoint)
            .then(resp => {
                if (!resp) {
                    throw new GunsmithError('Something went wrong, no characters found for this user.')
                }

                let [character] = resp.data.characters;
                return character.characterBase.characterId
            })
    }

    async _getItemIdFromSummary(membershipType, playerId, characterId, bucket) {
        const endpoint = `${membershipType}/Account/${playerId}/Character/${characterId}/Inventory/Summary`;
        return this.api(endpoint)
            .then(resp => {

                let {items} = resp.data;

                let item = _.find(items, object => {
                    return object.bucketHash === bucket;
                });

                if (!item)
                    throw new GunsmithError("Something went wrong, couldn't find the requested item for this character.");

                return item.itemId;

            })
    }

    async  _getItemDetails(membershipType, playerId, characterId, itemInstanceId) {
        const endpoint = `${membershipType}/Account/${playerId}/Character/${characterId}/Inventory/${itemInstanceId}`;
        const params = 'definitions=true';

        return this.api(endpoint, params)
            .then(resp => {
                return this.dataHelper.serializeFromApi(resp)
            })
    }

    async  _getVendorItemDetails(vendorId) {

        const endpoint = `/Platform/Destiny/Vendors/${vendorId}`;
        const params = 'definitions=true';

        return this.api(endpoint, params)
            .then(resp => {
                return resp;
            })
    }

    _getBucket(slot) {
        switch (slot) {
            case 'primary':
                return constants.TYPES.PRIMARY_WEAPON;
                break;
            case 'special':
            case 'secondary':
                return constants.TYPES.SPECIAL_WEAPON;
                break;
            case 'heavy':
                return constants.TYPES.HEAVY_WEAPON;
                break;
            case 'ghost':
                if (SHOW_ARMOR) {
                    return constants.TYPES.GHOST;
                }
                break;
            case 'head':
            case 'helmet':
                if (SHOW_ARMOR) {
                    return constants.TYPES.HEAD;
                }
                break;
            case 'chest':
                if (SHOW_ARMOR) {
                    return constants.TYPES.CHEST;
                }
                break;
            case 'arm':
            case 'arms':
            case 'gloves':
            case 'gauntlets':
                if (SHOW_ARMOR) {
                    return constants.TYPES.ARMS;
                }
                break;
            case 'leg':
            case 'legs':
            case 'boots':
            case 'greaves':
                if (SHOW_ARMOR) {
                    return constants.TYPES.LEGS;
                }
                break;
            case 'class':
            case 'mark':
            case 'bond':
            case 'cape':
            case 'cloak':
                if (SHOW_ARMOR) {
                    return constants.TYPES.CLASS_ITEMS;
                }
                break;
            default:
                null;
        }
    }

    async api(endpoint, params) {
        const BUNGIE_API_KEY = process.env.BUNGIE_API_KEY;
        const baseUrl = 'https://www.bungie.net/Platform/Destiny/';
        const trailing = '/';
        const queryParams = params ? `?${params}` : '';
        const url = baseUrl + endpoint + trailing + queryParams;
        return new Promise((resolve, reject) => {
            request({
                url: url,
                headers: {
                    'X-API-Key': BUNGIE_API_KEY
                }
            }, (err, res, body) => {
                let object = JSON.parse(body);
                resolve(object.Response);
            })

        })
    }
}
