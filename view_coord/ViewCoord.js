class ViewCoord {
    // ratio
    #listRatio = [1, 3, 5, 8, 10, 15, 25, 40, 50, 60, 75, 100, 125, 150, 200, 300, 400, 500, 600, 700].map(d => d / 100);
    #idxRatio = 0;
    #ratio = 1;

    // A - src
    #x = 0;
    #y = 0;

    // B - dest
    #bw;
    #bh;

    constructor() {
        this.ratio = 1;
    }

    set ratio(v) {
        this.#ratio = v;

        const idx = this.#listRatio.findIndex(d => v === d);
        if (-1 < idx) {
            this.#idxRatio = idx;
        } else {
            const bidx = this.#listRatio.findIndex(d => d > v);
            if (0 >= bidx) {
                // -- very small
                this.#idxRatio = 0;
            } else {
                this.#idxRatio = bidx - 1;
            }
        }

        this.resetScale();
    }

    plusRatioIdx(v) {
        let idx = this.#idxRatio + v;

        if (idx >= this.#listRatio.length) {
            idx = this.#listRatio.length - 1;
        } else if (idx < 0) {
            idx = 0;
        }

        // -- using interface
        this.idxRatio = idx;
    }

    set idxRatio(idx) {
        this.#idxRatio = idx;
        this.#ratio = this.#listRatio[idx];

        this.resetScale();
    }

    get ratio() {
        return this.#ratio;
    }

    set x(v) {
        this.#x = v;
    }

    set y(v) {
        this.#y = v;
    }

    get x() {
        return this.#x;
    }

    get y() {
        return this.#y;
    }

    get w() {
        // -- max value
        return this.scaleX(this.bw);
    }

    get h() {
        // -- max value
        return this.scaleY(this.bh);
    }

    set bw(v) {
        this.#bw = v;
    }

    set bh(v) {
        this.#bh = v;
    }

    get bw() {
        return this.#bw;
    }

    get bh() {
        return this.#bh;
    }

    A(x, y) {
        this.x = x;
        this.y = y;
    }

    B(w, h) {
        this.bw = w;
        this.bh = h;

        this.resetScale();
    }

    // not yet tested
    moveToBX(x) {
        const v = this.getAX(x);
        this.x = this.x + v;

        console.log(`x : ${this.x}`);
    }

    moveToBY(y) {
        const v = this.getAY(y);
        this.y = this.y + v;

        console.log(`y : ${this.y}`);
    }

    resetScale() {
        const scaleX = ViewCoord.scaleLinear([0, this.bw], [0, this.bw * 1 / this.ratio]);
        const scaleY = ViewCoord.scaleLinear([0, this.bh], [0, this.bh * 1 / this.ratio]);

        this.scaleX = scaleX;
        this.scaleY = scaleY;
    }

    getAX(bx) {
        if (this.scaleX) {
            return this.x + this.scaleX(bx);
        }

        return undefined;
    }

    getAY(by) {
        if (this.scaleY) {
            return this.y + this.scaleY(by);
        }

        return undefined;
    }

    getAPos(x, y) {
        return [this.getAX(x), this.getAY(y)];
    }

    getViewBox() {
        return `${this.x} ${this.y} ${this.w} ${this.h}`;
    }

    static scaleLinear(domain, range) {
        const diffDomain = domain[1] - domain[0];
        const diffRange = range[1] - range[0];

        return (v) => {
            return range[0] + diffRange * ((v - domain[0]) / diffDomain);
        }
    };

    static test1() {
        const coord = new ViewCoord();
        coord.B(1000, 1000);
        coord.plusRatioIdx(-3);
        const r = coord.ratio;
        if (0.5 !== r) {
            console.error(`Ratio should be 0.5 but ${r}`);
            return false;
        }

        const ax = coord.getAX(500);
        console.log(`ratio ${r}, ${ax} = ax(500)`);
        if (1000 !== ax) {
            console.error(`ax should be 1000 but ${ax}`);
        }
    }

    static test2() {
        const coord = new ViewCoord();
        coord.B(1000, 1000);
        coord.ratio = 2;
        coord.A(500, 500);

        const ax1 = coord.getAX(0);
        console.log(`ratio ${coord.ratio}, A 500, 500, ${ax1} = ax(0)`);
        if (500 !== ax1) {
            console.error(`ax1 should be 500 but ${ax1}`);
        }

        const ax2 = coord.getAX(50);
        console.log(`ratio ${coord.ratio}, A 500, 500, ${ax2} = ax(50)`);
        if (525 !== ax2) {
            console.error(`ax2 should be 525 but ${ax2}`);
        }
    }

}
