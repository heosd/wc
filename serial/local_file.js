class LocalFile {
    #handle = undefined;
    #buffer = [];
    #timerBuffer = undefined; // -- instant timer

    constructor() {
    }

    static async SelectFileWrite() {
        try {
            const newHandle = await window.showSaveFilePicker();
            return newHandle;
        } catch (e) {
            console.log('User aborted');
            return;
        }
    }

    static async SelectFileRead() {
        try {
            const newHandle = await window.showOpenFilePicker();
            return newHandle;
        } catch (e) {
            console.log('User aborted');
            return;
        }
    }

    static async Append(fileHandle, data) {
        const file = await fileHandle.getFile();
        const writableStream = await fileHandle.createWritable({ keepExistingData: true });

        // -- At the end
        await writableStream.seek(file.size);
        await writableStream.write(data);
        await writableStream.close();
    }

    static async ReadText(fileHandle) {
        const d = await fileHandle.getFile();
        return await d.text();
    }

    async selectFileRead() {
        this.#handle = await LocalFile.SelectFileRead();
    }

    async readText() {
        if (this.#handle) {
            const fh = this.#handle[0];
            const file = await fh.getFile();
            return await file.text();
        }

        return undefined;
    }

    async selectFileWrite() {
        this.#handle = await LocalFile.SelectFileWrite();
    }

    bufferdAppend(data) {
        if (!this.#handle) {
            return;
        }

        this.#buffer.push(data);
        this.orderToFlush();
    }

    orderToFlush() {
        const me = this;

        if (0 < this.#buffer.length && !this.#timerBuffer) {
            this.#timerBuffer = setTimeout(async () => {
                await me.flushBuffer();
                this.#timerBuffer = undefined;
                me.orderToFlush();
            }, 1);
        }
    }

    async flushBuffer() {
        const copied = this.#buffer.join('');
        this.#buffer = [];
        await LocalFile.Append(this.#handle, copied);

        // console.log(`Flushed ${copied.length}`);
    }

    async append(data) {
        if (!this.#handle) {
            return;
        }

        return await LocalFile.Append(this.#handle, data);
    }
}