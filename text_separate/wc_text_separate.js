class TextSeparate extends HTMLElement {

    static TEMPLATE = `
<style>
    .label-col {
        display: inline-block;
        width: 70px;
        text-overflow: ellipsis;
        overflow: hidden;
        font-family: monospace;
    }

    #btnOutToIn {
        width: 30%;
        height: 4ex;
    }

    #groupingCustomRegex {
        width: 30%;
    }
</style>

<div>
    <div>
        <span>Group</span>
        <span id="areaRegexButtons"></span>
    </div>
    <div>
        <span>Function</span>
        <span>
            <button id="btnReverse">Reverse</button>
            <button id="btnTrim">Trim</button>
            <button id="btnToTab">to Tab</button>
            <button id="btnToSpace">to Space</button>
        </span>
    </div>

    <div>
        <button id="btnOutToIn">OUT -> IN</button>
    </div>

    <input id="groupingCustomRegex" type="text">

    <textarea id="inText" style="width: 95%; height: 10ex"></textarea>

    <div id="areaPreProcess" style="height: 200px;">
    </div>

    <div>
        <button id="btnCheck">Check Cols</button>
    </div>

    <textarea id="outText" style="width: 95%; height: 300px"></textarea>
</div>
`;
    constructor() {
        super();

        // 1: true, 2: false...
        this.selectedGroupCheck = {};

        this.execShadow();
        this.initRegexButtons();
    }

    initEvents() {
        this.setOn('inText', 'change', e => this.onChangeInText());
        this.setOn('groupingCustomRegex', 'change', e => this.onChangeInText());
        this.setOn('btnOutToIn', 'click', e => this.onClickOutToIn());
        this.setOn('btnReverse', 'click', e => this.onClickReverse());
        this.setOn('btnTrim', 'click', e => this.onClickTrim());
        this.setOn('btnToTab', 'click', e => this.onClickToTab());
        this.setOn('btnToSpace', 'click', e => this.onClickToSpace());
        this.setOn('btnCheck', 'click', e => this.onClickCheckCols());
    }

    setOn(id, event, fn) {
        this.shadow.getElementById(id).addEventListener(event, fn);
    }

    initRegexButtons() {
        const me = this;
        const parent = this.shadow.getElementById('areaRegexButtons');

        const list = [
            ['String + Number', '([a-zA-Z0-9]+)'],
            ['Strings', '([a-zA-Z]+)'],
            ['Numbers', '([0-9\\.\\-\\+]+)'],
            ['Spaces', '([^\\s]+)'],
            ['Comma', '([^,]+)'],
            ['"xxx"', '"([^"]+)"'],
            ['\'xxx\'', "'([^']+)'"],
            ['(xxx)', '(\\([^\\)]+\\))'],
        ];

        list.forEach(item => {
            const btn = document.createElement('button');
            btn.textContent = item[0];
            btn.addEventListener('click', e => {
                me.setRegexp(item[1]);
                me.onChangeInText();
            });
            parent.appendChild(btn);
        });

        // -- init default regex as first one
        this.setRegexp(list[0][1]);
    }

    setRegexp(str) {
        this.shadow.getElementById('groupingCustomRegex').value = str;
    }

    connectedCallback() {
        this.initEvents();
    }

    execShadow(templateId) {
        // const e = document.getElementById(templateId);
        // const content = e.content;

        const template = document.createElement('template');
        template.innerHTML = TextSeparate.TEMPLATE;

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(template.content.cloneNode(true));
        this.shadow = shadowRoot;
    }

    onChangeInText() {
        const regex = this.getRegexSelected();
        if (!regex) {
            return;
        }

        const e = this.shadow.getElementById('inText');
        const parent = this.shadow.getElementById('areaPreProcess');
        const groups = [];

        try {
            // -- I only need 3 lines, no need to split all the lines! just read 2k
            const max2k = e.value.slice(0, Math.min(e.value.length, 2048));
            const lines = max2k.split('\n');

            for (let i = 0; i < Math.min(lines.length, 3); i++) {
                const l = lines[i];
                groups.push(l.match(regex));
            }

        } catch (e) {
            console.error(e);
        }

        parent.innerHTML = '';
        this.selectedGroupCheck = {};
        this.shadow.getElementById('outText').value = '';

        const ms = new Date().getTime();
        groups.forEach((group, i) => {
            if (!group) {
                return;
            }

            const elementGroup = document.createElement('p');
            const span = document.createElement('span');
            span.textContent = `${group.length}`;
            span.style.marginRight = '5px';
            span.style.marginLeft = '5px';
            elementGroup.appendChild(span);

            group.forEach((name, j) => {
                const chk = document.createElement('input');
                chk.type = 'checkbox';
                chk.setAttribute('data-row', i);
                chk.setAttribute('data-col', j);
                chk.id = `groups-${i}-${j}-${ms}`;
                chk.addEventListener('change', e => this.onChangeGroupCheck(e, chk));
                elementGroup.appendChild(chk);

                const label = document.createElement('label');
                label.textContent = name;
                label.title = `${j} ${name}`;
                label.setAttribute('for', chk.id);
                label.classList.add('label-col');
                elementGroup.appendChild(label);
            });
            parent.appendChild(elementGroup);
        });
    }

    onChangeGroupCheck(e, ele) {
        const col = ~~ele.getAttribute('data-col');
        this.selectedGroupCheck[col] = ele.checked;

        this.applyGroupCheck();
    }

    onClickCheckCols() {
        const lines = this.shadow.getElementById('inText').value.split('\n');
        const regex = this.getRegexSelected();
        const counts = lines.map(item => {
            const m = item.match(regex);
            if (m) {
                return m.length;
            }

            return 0;
        });

        const result = {};
        counts.forEach(num => {
            if (result[num]) {
                result[num]++;
            } else {
                result[num] = 1;
            }
        });

        const str = [];
        for (const [k, v] of Object.entries(result)) {
            str.push(`${k} : ${v}`);
        }

        this.shadow.getElementById('outText').value = str.join('\n');

        return result;
    }

    applyGroupCheck() {
        const list = [];
        for (const [k, v] of Object.entries(this.selectedGroupCheck)) {
            if (true === v) {
                list.push(~~k);
            }
        }

        const dataSource = this.shadow.getElementById('inText').value;

        const lines = dataSource.split('\n');

        const regex = this.getRegexSelected();
        const result = [];
        lines.forEach(line => {
            const m = line.match(regex);
            if (!m) {
                return;
            }

            const lineMatched = list.map(i => m[i] ?? '');
            result.push(lineMatched.join('\t'));
        });

        const out = this.shadow.getElementById('outText');
        out.value = result.join('\n');
    }

    getRegexSelected() {
        const str = this.shadow.getElementById('groupingCustomRegex').value;
        if (0 === str.indexOf('/')) {
            const m = str.match(/\/(.*)\/(.*)/);
            if (!m) {
                console.error(`invalid regex ${str}`);
                return undefined;
            }

            const exp = m[1];
            const arg = m[2];
            return new RegExp(exp, arg);
        } else {
            return new RegExp(str, 'g');
        }
    }

    regexGroup(str, regex, idx) {
        const m = str.match(regex);

        if ('number' === typeof idx) {
            if (!m) {
                return undefined;
            }

            return m[idx];
        } else {
            if (!m) {
                return [];
            }

            const r = idx.map(i => m[i]);
            return r;
        }
    }

    onClickOutToIn() {
        this.dataSource = this.result;
    }

    onClickReverse() {
        const str = this.dataSource;
        const lines = str.split('\n');
        const r = lines.map(line => line.split('').reduce((r, c) => c + r, '')).join('\n');
        this.dataSource = r;
    }

    onClickTrim() {
        const str = this.dataSource;
        const lines = str.split('\n');
        const r = lines.map(line => line.trim()).join('\n');
        this.dataSource = r;
    }

    onClickToTab() {
        const str = this.dataSource;
        const lines = str.split('\n');
        const r = lines.map(line => line.replace(/(\s+)/g, '\t')).join('\n');
        this.dataSource = r;
    }

    onClickToSpace() {
        const str = this.dataSource;
        const lines = str.split('\n');
        const r = lines.map(line => line.replace(/(\s+)/g, ' ')).join('\n');
        this.dataSource = r;
    }

    set dataSource(text) {
        this.shadow.querySelector('#inText').value = text;
        this.onChangeInText();
    }

    get dataSource() {
        return this.shadow.querySelector('#inText').value;
    }

    get result() {
        return this.shadow.querySelector('#outText').value;
    }
}

customElements.define('text-separate', TextSeparate);