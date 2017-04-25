import DefaultFormatter from "../../core/formatter";
export default class SlackFormatter extends DefaultFormatter {

    id = 'slack';

    bold(text) {
        return `*${text}*`;
    }

    italic(text) {
        return `_${text}_`;
    }

    strike(text) {
        return `~${text}~`;
    }

    get table() {
        return false;
    }

}
