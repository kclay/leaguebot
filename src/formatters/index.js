import TextBuilder from "./builder";
import SlackFormatter from "./slack";
import DefaultFormatter from "./default";

export const Formatters = [
    new DefaultFormatter(),
    new SlackFormatter()
];

export {
    TextBuilder,
    SlackFormatter
}

export class AutoFormatter {

    _fmt;

    constructor() {
        let id = process.env.HUBOT_TEXT_FORMATTER || 'default';
        this._fmt = Formatters.find(f => f.id == id);
        if (!this._fmt) {
            this._fmt = new DefaultFormatter();
        }
    }

    bold(text) {
        return this._fmt.bold(text);
    }

    italic(text) {
        return this._fmt.italic(text);
    }

    strike(text) {
        return this._fmt.strike(text);
    }

}
