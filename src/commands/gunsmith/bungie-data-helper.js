//https://github.com/phillipspc/showoff/blob/master/scripts/bungie-data-helper.coffee

const constants = require('./showoff-constants');
const _ = require('lodash');
export class DataHelper {

    serializeFromVendor(item, definitions) {

        return this.serializeInfo(item, definitions);
    }

    serializeFromApi(response) {

        let {item} = response.data;



        let info = this.serializeInfo(item, response.definitions);
        info.nodes = response.data.talentNodes;
        console.log(info.nodes);
        return info;

        // some weapons return an empty hash for definitions.damageTypes

    }

    serializeInfo(item, definitions) {
        let hash = item.itemHash;
        let itemDefs = definitions.items[hash];
        let damageTypeName;
        if (Object.keys(definitions.damageTypes).length !== 0) {
            if(item.damageTypes && item.damageTypes.length){

            }
            ({damageTypeName} = definitions.damageTypes[item.damageTypeHash]);
        } else {
            damageTypeName = 'Kinetic';

        }
        let stats = {};
        // for stat in item.stats
        let itemStats = item.stats;

        if (item.damageType !== 0) {
            // to expand using all the hidden stats, use the code below
            // itemStatHashes = ( "#{x.statHash}" for x in item.stats )
            // for h, s of response.definitions.items[hash].stats when h not in itemStatHashes
            //   itemStats.push s

            // to expand using a smaller list, match against EXTENDED_WEAPON_STATS
            for (let extHash of Array.from(constants.EXTENDED_WEAPON_STATS)) {
                let s = definitions.items[hash].stats[extHash];
                if (s !== null) {
                    itemStats.push(s);
                }
            }
        }

        let statHashes = constants.STAT_HASHES;
        for (let stat of Array.from(itemStats)) {
            if ((stat !== null ? stat.statHash : undefined) in statHashes) {
                stats[statHashes[stat.statHash]] = stat.value;
            }
        }

        let prefix = 'https://www.bungie.net';
        let iconSuffix = itemDefs.icon;
        let itemSuffix = `/en/Armory/Detail?item=${hash}`;


        return {
            itemName: itemDefs.itemName,
            itemDescription: itemDefs.itemDescription,
            itemTypeName: itemDefs.itemTypeName,
            color: parseInt(constants.DAMAGE_COLOR[damageTypeName], 16),
            iconLink: prefix + iconSuffix,
            itemLink: prefix + itemSuffix,
            nodeDefs: definitions.talentGrids[item.talentGridHash].nodes,
            damageType: damageTypeName,
            stats
        };
    }

    parsePayload(item) {
        let name = `${item.itemName}`;
        if (item.damageType !== "Kinetic") {
            name += ` [${item.damageType}]`;
        }
        let filtered = this.filterNodes(item.nodes, item.nodeDefs);
        let textHash = this.buildText(filtered, item.nodeDefs, item);
        let footerText = DataHelper.buildFooter(item);

        return {
            text: '',
            embed: {
                title: name,
                description: item.itemDescription,
                url: item.itemLink,
                color: item.color,
                fields: _.map(textHash, (string, column) => {
                    return {
                        name: `Column ${column}`,
                        value: string
                    }
                }),


                footer: {
                    text: footerText
                },
                thumbnail: {
                    url: item.iconLink,
                    width: 60,
                    height: 60
                }
            }

        };
    }

    // removes invalid nodes, orders according to column attribute
    filterNodes(nodes, nodeDefs) {
        let validNodes = [];
        let invalid = function (node) {
            let name = nodeDefs[node.nodeIndex].steps[node.stepIndex].nodeStepName;
            let skip = ["Upgrade Damage", "Void Damage", "Solar Damage", "Arc Damage", "Kinetic Damage", "Ascend", "Reforge Ready", "Deactivate Chroma", "Red Chroma", "Blue Chroma", "Yellow Chroma", "White Chroma"];
            return (node.stateId === "Invalid") || (node.hidden === true) || Array.from(skip).includes(name);
        };
        let node;
        for ( node of Array.from(nodes)) {
            if (!invalid(node)) {
                validNodes.push(node);
            }
        }

        let orderedNodes = [];
        let column = 0;

        while (orderedNodes.length < validNodes.length) {
            let idx = 0;
            while (idx < validNodes.length) {
                node = validNodes[idx];
                let nodeColumn = nodeDefs[node.nodeIndex].column;
                if (nodeColumn === column) {
                    orderedNodes.push(node);
                }
                idx++;
            }
            column++;
        }
        return orderedNodes;
    }

    buildText(nodes, nodeDefs, item) {
        let getName = function (node) {
            let step = nodeDefs[node.nodeIndex].steps[node.stepIndex];
            return step.nodeStepName;
        };

        let text = {};
        let setText = function (node) {
            let step = nodeDefs[node.nodeIndex].steps[node.stepIndex];
            let {column} = nodeDefs[node.nodeIndex];
            let name = step.nodeStepName;
            if (node.isActivated) {
                name = `**${step.nodeStepName}**`;
            }
            if (!text[column]) {
                text[column] = "";
            }
            return text[column] += (text[column] ? ' | ' : '') + name;
        };

        for (let node of Array.from(nodes)) {
            setText(node);
        }
        return text;
    }

    // stats go in the footer
    static buildFooter(item) {
        let stats = [];
        for (let statName in item.stats) {
            let statValue = item.stats[statName];
            stats.push(`${statName}: ${statValue}`);
        }
        return stats.join(', ');
    }
}

export default DataHelper;
