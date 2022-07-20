class InjectRequest {
    static TEMPLATE = `
    <div id="areaInput">
        <input id="injTxtURL" type="text" style="width: 450px">
        <button id="injBtnSubmit">Submit</button>

        <br>

        <button id="injBtnFileWrite">File Write</button>
    </div>
`;
    constructor() {
        this.initLayout();
        this.initEvents();
        this.startChildStateTimer();

        // -- set current location
        document.getElementById('injTxtURL').value = location.href;
    }

    initLayout() {
        const div = document.getElementById('inject_div');
        if (div) {
            div.remove();
            return;
        }

        const e = document.createElement('div');
        e.style.display = 'inline-block';
        e.style.left = 0;
        e.style.top = 0;
        e.style.width = '500px';
        e.style.height = '500px';
        e.style.background = 'coral';
        e.style.position = 'absolute';
        e.id = 'inject_div';

        e.innerHTML = InjectRequest.TEMPLATE;

        document.body.appendChild(e);
    }

    initEvents() {
        const me = this;
        document.getElementById('injBtnSubmit').addEventListener('click', () => this.onClickOpenURL());
        document.getElementById('injBtnFileWrite').addEventListener('click', () => this.openFileWrite());
    }

    onClickOpenURL() {
        const url = document.getElementById('injTxtURL').value;
        const child = InjectRequest.OpenPopup(url);

        this.child = child;
    }

    query(selector) {
        if (this.child) {
            return this.child.document.querySelector(selector);
        }

        return undefined;
    }

    queryAll(selector) {
        if (this.child) {
            return this.child.document.querySelectorAll(selector);
        }

        return undefined;
    }

    eid(id) {
        if (this.child) {
            return this.child.document.getElementById(id);
        }

        return undefined;
    }

    startChildStateTimer() {
        const me = this;
        if (this.childStateTimer) {
            console.error(`readyTimer already exist`);
            return;
        }

        this.childStateTimer = setInterval(() => {
            const newState = me.readChildState();

            me.setChildState(newState);
        }, 500);
    }

    stopChildStateTimer() {
        if (this.childStateTimer) {
            clearInterval(this.childStateTimer);
            this.childStateTimer = undefined;
        }
    }

    setChildState(newState) {
        if (this.childState !== newState) {
            this.notifyChildStateChange(this.childState, newState);
            this.childState = newState;
        }
    }

    notifyChildStateChange(oldState, newState) {
        if (this.fnChildStateChange) {
            this.fnChildStateChange(oldState, newState, this);
        }
    }

    setOnChildStateChange(fn) {
        this.fnChildStateChange = fn;
    }

    readChildState() {
        if (!this.child) {
            return undefined;
        }

        return this.child.document.readyState;
    }

    static OpenPopup(url) {
        return window.open(url, '_mychild', "popup=true,width=500,height=500");
    }

    static async Append(fileHandle, data) {
        const file = await fileHandle.getFile();
        const writableStream = await fileHandle.createWritable({ keepExistingData: true });

        // -- At the end
        await writableStream.seek(file.size);
        await writableStream.write(data);
        await writableStream.close();
    }

    async openFileWrite() {
        this.fileWrite = await window.showSaveFilePicker();
    }

    async append(data) {
        if (this.fileWrite) {
            await InjectRequest.Append(this.fileWrite, data);
        } else {
            console.error(`No File open`);
        }
    }
}

/*
let inj = new InjectRequest();
inj.setOnChildStateChange(async (a, b) => {
    console.log('state changed');
    console.log(a, b);

    if ('complete' === b) {
        const str = `\n\n###${window.myquery}###\n`;
        const html = getResult();

        const all = str + html + '\n';

        inj.append(all);

        console.log('can i Proceed next?');
    }
});
*/