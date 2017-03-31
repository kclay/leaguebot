export default class TextBuilder {

    _blocks = [];


    fmt;

    constructor(fmt) {
        this.fmt = fmt;
    }

    _append(method, text) {
        if (text) {
            this._blocks.push(this.fmt[method](text));
        }
        return this;
    }

    bold(text) {
        return this._append('bold', text);
    }

    italic(text) {
        return this._append('italic', text);
    }

    strike(text) {
        return this._append('strike', text);
    }

    add(text) {
        if (text) {
            this._blocks.push(text);
        }
        return this;
    }

    toString() {
        return this._blocks.join(' ');
    }

    valueOf() {
        return this.toString();
    }

    get error() {
        return this.wrap((t) => t.bold('Error :'), 'italic');
    }

    wrap(cb, method) {
        let v = cb(new this.constructor(this.fmt))._;
        return this[method](v);
    }

    get _() {
        return this.toString();
    }
}


class AttachmentBuilder {

}
