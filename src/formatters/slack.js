export default class SlackFormatter {

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

}
