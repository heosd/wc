let selectorInput = 'body > table.bodytext > tbody > tr:nth-child(2) > td > form > span:nth-child(7) > input[type=text]';
let selectorSubmit = 'body > table.bodytext > tbody > tr:nth-child(2) > td > form';
let selectorResult = 'body > table.bodytext';
let waitSecondsQ = 5;

let listRequests = [];

let inj = new InjectRequest();
inj.setOnChildStateChange(async (a, b) => {
    console.log(`state changed '${a}' -> ${b}`);

    if ('complete' === b) {
        const str = `\n\n###${window.myquery}###\n`;
        const html = getResultQ();

        const all = str + html + '\n';

        inj.append(all);

        console.log('can i Proceed next?');
        proceedNext();
    }
});

function setQ(str) {
    inj.set(selectorInput, str);
    window.myquery = str;
}

function submitQ() {
    inj.submit(selectorSubmit);
}

function getResultQ() {
    return inj.query(selectorResult).innerHTML;
}

function proceedNext() {
    console.log(`trying to request next after ${waitSecondsQ}, ${listRequests.length} left`);

    if(0 === listRequests.length) {
        console.log(`But no next`);
        return;
    }

    window.timerQ = setTimeout(() => {
        const name = listRequests.shift();
        console.log(`Doing '${name}'`);
        setQ(name);
        submitQ();

    }, waitSecondsQ * 1000);
}

function stopQ() {
    try {
        if (window.timerQ) {
            clearTimeout(window.timerQ);
        }
    } catch (e) { }

    window.timerQ = undefined;
    listRequests = [];
}

