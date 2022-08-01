// TODO domain, scale not yet implemented

class PlotBasic extends HTMLCanvasElement {
    static DEFAULT_MARGIN = 50;

    constructor() {
        super();

        this.ctx = this.getContext('2d');

        this.setDataSource([]);
    }

    connectedCallback() {
        // browser calls this method when the element is added to the document
        // (can be called many times if an element is repeatedly added/removed)
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

    setDataSource(ds) {
        this.ds = ds;

        let min = undefined;
        let max = undefined;

        for (let i = 0; i < ds.length; i++) {
            const item = ds[i];

            if(min > item || isNaN(min)) {
                min = item;
            }

            if (max < item || isNaN(max)) {
                max = item;
            }
        }

        this.min = min;
        this.max = max;
        this.length = ds.length;

        this.initScale();

        this.refreshChild();
    }

    push(value) {
        this.ds.push(value);

        // -- pop out
        const limit = this.dataLimit;
        while (this.ds.length > limit) {
            this.ds.shift();
        }

        this.length = this.ds.length;

        if (this.max < value || isNaN(this.max)) {
            this.max = value;
        }

        if (this.min > value || isNaN(this.min)) {
            this.min = value;
        }

        this.initScale();

        this.refreshChild();
    }

    get dataMargin() {
        if (!this.hasAttribute('data-margin')) {
            return PlotBasic.DEFAULT_MARGIN;
        }

        const attr = ~~this.getAttribute('data-margin');
        return attr;
    }

    get dataScale() {
        if (!this.hasAttribute('data-scale')) {
            return [NaN, NaN];
        }

        const attr = this.getAttribute('data-scale');
        return PlotBasic.ParseMinMax(attr);
    }

    get dataDomain() {
        if (!this.hasAttribute('data-domain')) {
            return [NaN, NaN];
        }

        const attr = this.getAttribute('data-domain');
        return PlotBasic.ParseMinMax(attr);
    }

    get dataLimit() {
        if (!this.hasAttribute('data-limit')) {
            return this.width * 2;
        }

        const attr = ~~this.getAttribute('data-limit');
        if (0 < attr) {
            return attr;
        }

        return this.width * 2;
    }


    refreshChild() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.drawReference();

        this.ctx.beginPath();

        const x0 = this.scaleX(0);
        const y0 = this.scaleY(this.ds[0]);
        this.ctx.moveTo(x0, y0);

        for (let i = 1; i < this.ds.length; i++) {
            const item = this.ds[i];
            const x = this.scaleX(i);
            const y = this.scaleY(item);

            this.ctx.lineTo(x, y);
        }

        this.ctx.stroke();
    }

    drawReference() {
        const box = this.box;

        this.ctx.beginPath();
        this.ctx.moveTo(box.l, box.t);
        this.ctx.lineTo(box.l, this.height);
        this.ctx.moveTo(0, box.b);
        this.ctx.lineTo(box.r, box.b);
        this.ctx.stroke();

        this.ctx.font = `20px monospace`;

        // -- y min
        this.ctx.textAlign = 'end';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText(this.min, box.l - 5, box.b);

        // -- y max
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(this.max, box.l - 5, box.t);

        // -- x max
        this.ctx.fillText(this.length, box.r, box.b + 5);
    }

    initScale() {
        const margin = this.dataMargin;

        const box = {
            l: margin,
            t: margin,
            r: this.width - margin,
            b: this.height - margin
        };

        this.box = box;
        this.scaleX = PlotBasic.ScaleLinear([0, this.length - 1], [box.l, box.r]);
        this.scaleY = PlotBasic.ScaleLinear([this.min, this.max], [box.b, box.t]);
    }

    startRandom(ms) {
        const me = this;
        const interval = ms ?? 1000;
        this.stopRandom();
        this.timer = setInterval(() => {
            me.push(~~(Math.random() * 100));
        }, interval);
    }

    stopRandom() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }

    static ParseMinMax(str) {
        const arr = str.replace(/\s*/g, '');
        const m = arr.match(/\[([0-9\.\-\+]*),([0-9\.\-\+]*)\]/);
        if (m) {
            const min = parseFloat(m[1]);
            const max = parseFloat(m[2]);

            return [min, max];
        }

        return [NaN, NaN];
    }

    static ScaleLinear(domain, range) {
        const diffDomain = domain[1] - domain[0];
        const diffRange = range[1] - range[0];

        return (v) => {
            return range[0] + diffRange * ((v - domain[0]) / diffDomain);
        }
    };
}

customElements.define('plot-basic', PlotBasic, { extends: 'canvas' });