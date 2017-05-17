import DefaultFormatter from "../../core/formatter";
const Discord = require('discord.js');
const MarkdownTable = require('markdown-table');
class Formatter extends DefaultFormatter {

    get embed() {
        return new EmbedBuilder();
    }

    get table() {
        return MarkdownTable
    }
    bold(text) {
        return `*${text}*`;
    }
}

export {
    Formatter
}
export default Formatter


class EmbedBuilder {

    _embed = new Discord.RichEmbed();

    author(v) {
        this._author = v;
    }


}
