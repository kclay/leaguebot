import DefaultFormatter from "../../core/formatter";
const Discord = require('discord.js');
class Formatter extends DefaultFormatter {

    get embed() {
        return new EmbedBuilder();
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
