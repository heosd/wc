class TerminalWindow extends HTMLElement {
    #dataLimit = 1000;
    #lockScroll = false;
    #displayTS = false;
    #displayHEX = false;

    static #TEMPLATE = `
<style>
    .terminal {
        font-family: monospace;
        width: 100%;
        height: 100%;
        padding: 5px;
        overflow-y: scroll;
    }

    .dark {
        background-color: #333;
        color: #ddd;
    }

    .hide {
        display: none;
    }

    .terminal-line {
        width: 100%;
        word-wrap: break-word;
        margin: 0;
        display: flex;
        align-items: stretch;
    }

    .cls-ts {
        flex: 1 200px;
        overflow: hidden;
        border-right: 1px solid #eee;
    }

    .cls-text {
        flex: 10;
        padding-left: 7px;
        margin-right: 5px;
    }

    .cls-hex {
        flex: 2 360px;
        overflow: hidden;
        padding-left: 7px;
        border-left: 1px solid #eee;
    }
</style>

<div id="terminal" class="terminal dark">
</div>
    `;

    constructor() {
        super();

        const me = this;
        if ('' === this.style.display) {
            this.style.display = 'flex';
        }

        // this.execShadow('template-terminal-window');
        this.execShadowContent(TerminalWindow.#TEMPLATE);

        const parent = this.shadow.getElementById('terminal');
        parent.addEventListener('scroll', (e) => {
            // 50px is margin
            const top = (parent.scrollTop + 50);
            const scroll = (parent.scrollHeight - parent.clientHeight);
            if (top >= scroll) {
                me.#lockScroll = false;
            } else {
                me.#lockScroll = true;
            }
        });

        parent.addEventListener('dblclick', (e) => {
            const side = ~~((e.clientX / parent.offsetWidth) * 10);
            if (3 > side) {
                me.setAttribute('data-ts', !me.#displayTS);
            } else if (7 > side) {
                // -- do nothing, later on
            } else {
                me.setAttribute('data-hex', !me.#displayHEX);
            }
        });

        this.parent = parent;
    }

    connectedCallback() {
        // browser calls this method when the element is added to the document
        // (can be called many times if an element is repeatedly added/removed)
    }

    attrDataLimit(attr) {
        const limit = ~~attr;
        if (0 < limit) {
            this.#dataLimit = limit;
        } else {
            console.error(`Invalid data-limit should be bigger than 0 ${limit}`);
        }
    }

    attrTS(attr) {
        if ('true' === attr.toLowerCase() || ~~attr) {
            this.#displayTS = true;
        } else {
            this.#displayTS = false;
        }
    }

    attrHEX(attr) {
        if ('true' === attr.toLowerCase() || ~~attr) {
            this.#displayHEX = true;
        } else {
            this.#displayHEX = false;
        }
    }

    disconnectedCallback() {
        // browser calls this method when the element is removed from the document
        // (can be called many times if an element is repeatedly added/removed)
    }

    static get observedAttributes() {
        return ['data-ts', 'data-hex', 'data-limit'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        let needToRefreshChild = false;

        if ('data-limit' === name) {
            this.attrDataLimit(newValue);
        }

        if ('data-ts' === name) {
            this.attrTS(newValue);

            if (oldValue != newValue) {
                needToRefreshChild = true;
            }
        }

        if ('data-hex' === name) {
            this.attrHEX(newValue);

            if (oldValue != newValue) {
                needToRefreshChild = true;
            }
        }

        if (needToRefreshChild) {
            this.refreshChild();
        }
    }

    adoptedCallback() {
        // called when the element is moved to a new document
        // (happens in document.adoptNode, very rarely used)
    }

    // there can be other element methods and properties

    setDataSource(ds) {
        this.ds = ds;
        this.refreshChild();
    }

    pushLine(line) {
        const l1 = this.line01TS();
        const l2 = this.line02String(line);
        const l3 = this.line03HEX(line);

        const p = document.createElement('p');
        p.classList.add('terminal-line');
        p.appendChild(l1);
        p.appendChild(l2);
        p.appendChild(l3);

        this.appendLine(p);
    }

    pushHexLine(line) {
        const l1 = this.line01TS();
        const l2 = this.line02HEX(line);
        // const l3 = this.line03HEX(line);

        const p = document.createElement('p');
        p.classList.add('terminal-line');
        p.appendChild(l1);
        p.appendChild(l2);
        // p.appendChild(l3);

        this.appendLine(p);
    }

    line01TS() {
        const l1 = document.createElement('span');
        // -- timestamp
        l1.classList.add('cls-ts');
        const now = new Date();
        l1.textContent = now.toLocaleString('af');
        l1.setAttribute('data-ms', now.getTime());
        TerminalWindow.AddChildHideClass([l1], this.#displayTS);

        return l1;
    }

    line02String(value) {
        const l2 = document.createElement('span');
        // -- string
        l2.classList.add('cls-text');
        l2.textContent = value;

        return l2;
    }

    line02HEX(value) {
        const l2 = document.createElement('span');
        // -- string
        l2.classList.add('cls-text');
        l2.textContent = value;

        return l2;
    }

    line03HEX(value) {
        // -- hex
        const l3 = document.createElement('span');
        l3.classList.add('cls-hex');
        const hexValues = [];
        for (let i = 0; i < value.length; i++) {
            const hex = value.charCodeAt(i).toString(16).padStart(2, '0');
            hexValues.push(hex);
        }

        l3.textContent = hexValues.join(' ');
        TerminalWindow.AddChildHideClass([l3], this.#displayHEX);
        return l3;
    }

    appendLine(element) {
        while (this.#dataLimit < (this.parent.childElementCount + 1)) {
            this.parent.childNodes[0].remove();
        }

        this.parent.appendChild(element);

        if (!this.#lockScroll) {
            element.scrollIntoView(false);
        }
    }

    refreshChild() {
        this.queryAddChildHideClass('.cls-ts', this.#displayTS);
        this.queryAddChildHideClass('.cls-hex', this.#displayHEX);
    }

    execShadow(templateId) {
        const e = document.getElementById(templateId);
        const content = e.content;

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(content.cloneNode(true));
        this.shadow = shadowRoot;
    }

    execShadowContent(content) {
        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = content;
        this.shadow = shadowRoot;
    }

    static AddChildHideClass(listNodes, bool) {
        // -- not to use if in loop
        if (bool) {
            for (let i = 0; i < listNodes.length; i++) {
                const item = listNodes[i];
                item.classList.remove('hide');
            }
        } else {
            for (let i = 0; i < listNodes.length; i++) {
                const item = listNodes[i];
                item.classList.add('hide');
            }
        }
    }

    queryAddChildHideClass(q, bool) {
        return TerminalWindow.AddChildHideClass(this.parent.querySelectorAll(q), bool);
    }
}

customElements.define('terminal-window', TerminalWindow);