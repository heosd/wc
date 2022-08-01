class LocalSerial {
    #port = undefined;
    #timerRead = undefined;
    #writer = undefined;
    #buffer = undefined; // buffer

    constructor() {
        this.enc = new TextEncoder();
        this.dec = new TextDecoder();
    }

    static async Open(baudRate) {
        try {
            const port = await navigator.serial.requestPort();
            const br = ~~(baudRate ?? 9600);
            await port.open({ baudRate: br });

            return port;
        } catch (e) {
            console.log(`Failed to open serial port`);
            console.error(e);
        }
    }

    static SetReader(port, fn) {
        const timer = setTimeout(async () => {
            while (port.readable) {
                const reader = port.readable.getReader();
                try {
                    while (true) {
                        const { value, done } = await reader.read();
                        if (done) {
                            console.log('Read Done');
                            break;
                        }

                        if (fn) {
                            fn(value);
                        } else {
                            console.log(value);
                        }
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    reader.releaseLock();
                }
            }
        }, 1);

        return timer;
    }

    static async Write(port, str) {
        const writer = port.writable.getWriter();
        const textEncoder = new TextEncoder();
        await writer.write(textEncoder.encode(str));
    }

    static async WriteUint(port, uint8Array) {
        const writer = port.writable.getWriter();
        await writer.write(uint8Array);
    }

    static ConcatAB(b1, b2) {
        var tmp = new Uint8Array(b1.byteLength + b2.byteLength);
        tmp.set(new Uint8Array(b1), 0);
        tmp.set(new Uint8Array(b2), b1.byteLength);
        return tmp;

    }

    async open(baudRate) {
        const me = this;
        this.#port = await LocalSerial.Open(baudRate);
        this.#timerRead = LocalSerial.SetReader(this.#port, (v) => {
            me.push(v);
        });

        this.#writer = this.#port.writable.getWriter();
    }

    async write(str) {
        if (this.#writer) {
            return await this.#writer.write(this.enc.encode(str));
        }
    }

    async writeUint(uint8Array) {
        if (this.#writer) {
            return await this.#writer.write(uint8Array);
        }
    }

    push(uint8array) {
        const str = this.dec.decode(uint8array);
        if (this.onAll) {
            this.onAll(str);
        }

        if (this.#buffer) {
            this.#buffer = LocalSerial.ConcatAB(this.#buffer, uint8array);
        } else {
            this.#buffer = uint8array;
        }

        while (true) {
            const idx = this.#buffer.findIndex(item => 10 === item || 13 === item);
            if (-1 === idx) {
                break;
            }

            const line = this.#buffer.slice(0, idx);
            this.#buffer = this.#buffer.slice(idx + 1);

            if (this.onEnter) {
                const lineStr = this.dec.decode(line);
                this.onEnter(lineStr);
            }
        }
    }

    setOnAll(fn) {
        this.onAll = fn;
    }

    setOnEnter(fn) {
        this.onEnter = fn;
    }
}