class CircleBuffer {
    constructor(num) {
        this.initBuffer(num);
    }

    initBuffer(num) {
        this.buffer = [];
        this.idx = 0;

        for (let i = 0; i < num; i++) {
            this.buffer.push('');
        }
    }

    testIdx(diff) {
        let n = this.idx + diff;

        const len = this.buffer.length;
        n = n % len;
        if (n < 0) {
            return len + n;
        }

        return n;
    }

    next() {
        const n = this.testIdx(1);
        this.idx = n;
    }

    prev() {
        const n = this.testIdx(-1);
        this.idx = n;
    }

    set(v) {
        this.buffer[this.idx] = v;
    }

    get() {
        return this.buffer[this.idx];
    }

    getThree() {
        const i1 = this.testIdx(-1);
        const i3 = this.testIdx(1);
        const v1 = this.buffer[i1];
        const v2 = this.buffer[this.idx];
        const v3 = this.buffer[i3];

        return [[i1, v1], [this.idx, v2], [i3, v3]];
    }
}

class TerminalInput extends HTMLElement {
    #onEnter = undefined;

    static #TEMPLATE = `
<style>
    .mono {
        font-family: monospace;
    }

    .dark {
        background-color: #333;
        color: #ddd;
    }

    .borderless {
        border-width: 0px;
        border: none;
        outline: none;
    }

    .w {
        width: 95%
    }
</style>

<div class="dark">
    <input type="checkbox" id="chkCR">
    <label for="chkCR">CR</label>

    <input type="checkbox" id="chkLF">
    <label for="chkLF">LF</label>

    <input type="checkbox" id="chkHEX">
    <label for="chkHEX">HEX</label>

    <select id="selectInterval" style="margin-left: 10px;">
        <option value="0">- NO -</option>
        <option value="1">1s</option>
        <option value="2">2s</option>
        <option value="3">3s</option>
        <option value="5">5s</option>
        <option value="10">10s</option>
        <option value="15">15s</option>
        <option value="30">30s</option>
        <option value="60">1m</option>
        <option value="120">2m</option>
    </select>

</div>
<div class="dark mono">
    <input id="i1" type="text" readonly="readonly" class="borderless dark w">
    <br>
    <input id="i2" type="text" class="borderless dark w">
    <br>
    <input id="i3" type="text" readonly="readonly" class="borderless dark w">
</div>
    `;
    constructor() {
        super();

        // this.execShadow('template-terminal-input');
        this.execShadowContent(TerminalInput.#TEMPLATE);

        this.buffer = new CircleBuffer(30);

        this.chkCR = this.shadow.getElementById('chkCR');
        this.chkLF = this.shadow.getElementById('chkLF');
        this.chkHEX = this.shadow.getElementById('chkHEX');

        this.i1 = this.shadow.getElementById('i1');
        this.i2 = this.shadow.getElementById('i2');
        this.i3 = this.shadow.getElementById('i3');

        this.selectInterval = this.shadow.getElementById('selectInterval');

        this.setEvents();
    }

    connectedCallback() {
        // browser calls this method when the element is added to the document
        // (can be called many times if an element is repeatedly added/removed)

        if (!this.hasAttribute('tabindex')) {
            // Choose one of the following lines (but not both):
            this.setAttribute('tabindex', 0);
            this.tabIndex = 0;
        }
    }

    disconnectedCallback() {
        // browser calls this method when the element is removed from the document
        // (can be called many times if an element is repeatedly added/removed)
    }

    static get observedAttributes() {
        return [/* array of attribute names to monitor for changes */];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        // called when one of attributes listed above is modified
    }

    adoptedCallback() {
        // called when the element is moved to a new document
        // (happens in document.adoptNode, very rarely used)
    }

    // there can be other element methods and properties

    setEvents() {
        const me = this;

        this.i2.addEventListener('keydown', (e) => {
            // console.log(e);

            let update = false;
            if ('ArrowUp' === e.key) {
                // console.log('UP');
                me.buffer.set(me.i2.value);
                me.buffer.prev();
                update = true;
            } else if ('ArrowDown' === e.key) {
                // console.log('DN');
                me.buffer.set(me.i2.value);
                me.buffer.next();
                update = true;
            } else if ('Enter' === e.key) {
                // console.log('Enter');
                const value = me.i2.value;
                me.buffer.set(value);
                me.buffer.next();
                update = true;

                me.eventEnter(value);
            } else if ('Escape' === e.key) {
                me.buffer.set('');
                update = true;
            }

            if (update) {
                me.updateView();
            }
        });

        // -- check hex true ? off CR LF
        this.chkHEX.addEventListener('change', (e) => {
            if (me.chkHEX.checked) {
                me.chkCR.checked = false;
                me.chkLF.checked = false;
            }
        });

        this.selectInterval.addEventListener('change', (e) => {
            const seconds = ~~me.selectInterval.value;

            me.execSelectInterval(seconds);
        });

        this.addEventListener('focus', (e) => {
            me.i2.focus();
        });
    }

    eventEnter(value) {
        if (this.chkHEX.checked) {
            // FF AA -> FFAA
            const noSpace = value.replace(/\s*/g, ''); // remove all spaces
            if (0 !== noSpace.length % 2) {
                console.error('Invalid input, string should be like AB CD');
                return;
            }

            const arrHex = noSpace.match(/.{2}/g);

            const uint8 = new Uint8Array(arrHex.length);
            arrHex.forEach((hex, i) => uint8[i] = parseInt(hex, 16));

            if (this.#onEnter) {
                this.#onEnter(uint8, true);
            }
        } else {
            let list = [value];
            if (this.chkCR.checked) {
                list.push('\r');
            }

            if (this.chkLF.checked) {
                list.push('\n');
            }

            const str = list.join('');

            if (this.#onEnter) {
                this.#onEnter(str, false);
            }
        }
    }

    updateView() {
        const values = this.buffer.getThree();

        const idx = this.buffer.idx;

        this.i1.value = values[0][1];
        this.i2.value = values[1][1];
        this.i3.value = values[2][1];

        // -- DEBUG
        // this.i1.value = `${values[0][0]} ${values[0][1]}`;
        // this.i2.value = values[1][1];
        // this.i3.value = `${values[2][0]} ${values[2][1]}`;
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

    execSelectInterval(seconds) {
        const me = this;

        if (0 === seconds && this.timerSend) {
            clearInterval(this.timerSend);
            this.timerSend = undefined;
            return;
        }

        if (this.timerSend) {
            clearInterval(this.timerSend);
        }

        this.timerSend = setInterval(() => {
            this.countingSeconds--;

            if (0 >= this.countingSeconds) {
                me.eventEnter(me.i2.value);
                this.countingSeconds = seconds;
            }
        }, 1000);

        this.intervalSeconds = seconds;
        this.countingSeconds = seconds;
    }

    setOnEnter(fn) {
        this.#onEnter = fn;
    }
}

customElements.define('terminal-input', TerminalInput);