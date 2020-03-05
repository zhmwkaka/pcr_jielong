window.pcr = new Object;
window.pcr.clickHistory = new Set(JSON.parse(localStorage.getItem("clickedHistory") || '[]'));
window.pcr.showName = false;
window.pcr.editClickHistory = false;
window.pcr.sortIf = true;
window.pcr.nRecursive = 5; // odd number
window.pcr.preWord = "全部";

$.ajax('assets/data.json').done(data => {
    window.pcr.META = data.meta;
    window.pcr.DATA_ARRAY = data.data;
    window.pcr.SAME_META = new Set(data.sameMeta[0]);
    window.pcr.allList = { "me": {}, "npc": {} };
    let tme = {};
    let tnpc = {};
    window.pcr.META.forEach(e => {
        if (window.pcr.SAME_META.has(e)) {
            window.pcr.allList.me[e] = tme;
            window.pcr.allList.npc[e] = tnpc;
        } else if (e !== "全部") {
            window.pcr.allList.me[e] = {};
            window.pcr.allList.npc[e] = {};
        }
    });
    window.pcr.DATA_ARRAY.forEach(e => {
        addToObj(window.pcr.allList.me[e.head], e.tail);
        if (e.type !== "puricone") {
            addToObj(window.pcr.allList.npc[e.head], e.tail);
        }
    });
    initData();
});

function addToObj(obj, tail) {
    if (!obj[tail]) {
        obj[tail] = 0;
    }
    obj[tail]++;
}

$("#clearClickHistory").click(e => {
    localStorage.removeItem('clickedHistory');
    window.pcr.clickHistory.clear();
    initData();
});

$(document).bind('contextmenu', e => false);

$("#showName").click(e => {
    window.pcr.showName = e.currentTarget.checked;
    reProcess();
});

$("#editClickHistory").click(e => {
    window.pcr.editClickHistory = e.currentTarget.checked;
    reProcess();
});

$("#sortIf").click(e => {
    window.pcr.sortIf = e.currentTarget.checked;
    reProcess();
})

function initData() {
    window.pcr.remainList = { "me": {}, "npc": {} };
    let tme = { "n": 0 };
    let tnpc = { "n": 0 };
    window.pcr.META.forEach(e => {
        if (window.pcr.SAME_META.has(e)) {
            window.pcr.remainList.me[e] = tme;
            window.pcr.remainList.npc[e] = tnpc;
        } else if (e !== "全部") {
            window.pcr.remainList.me[e] = { "n": 0 };
            window.pcr.remainList.npc[e] = { "n": 0 };
        }
    });
    window.pcr.DATA_ARRAY.forEach(e => {
        if (!isClicked(e.name, e.iconID)) {
            window.pcr.remainList.me[e.head].n++;
            if (e.type !== "puricone") {
                window.pcr.remainList.npc[e.head].n++;
            }
        }
    });
    const metaDiv = $("#meta");
    metaDiv.empty();
    window.pcr.META.forEach(e => {
        metaDiv.append($(`<div>${e}</div>`));
    });
    $('#meta').on('click', 'div', e => {
        let divText = e.currentTarget.textContent.trim();
        process(divText);
    });
    process(null);
}

function reProcess() {
    process(window.pcr.preWord);
}

function process(word) {
    const gameTable = $("#game");
    let dataArray = [];
    window.pcr.DATA_ARRAY.forEach(e => {
        if (isMatchWord(e, word)) {
            dataArray.push(e);
        }
    });
    dataArray = sort(dataArray);
    window.pcr.preDataArray = dataArray;
    window.pcr.preWord = word;
    draw(dataArray);
}

function sort(dataArray) {
    if (!window.pcr.sortIf) {
        computeWeight();
        dataArray.sort((a, b) => window.pcr.weights[b.tail].w - window.pcr.weights[a.tail].w);
    }
    return dataArray;
}

function initWeight() {
    window.pcr.weights = {};

    let t = { "w": 0 };
    window.pcr.META.forEach(e => {
        if (window.pcr.SAME_META.has(e)) {
            window.pcr.weights[e] = t;
        } else if (e !== "全部") {
            window.pcr.weights[e] = { "w": 0 };
        }
    });
}

function computeWeight() {
    initWeight();
    for (let i = 0, k = 1; i < window.pcr.nRecursive; i++, k *= 10) {
        temp = window.pcr.weights;
        initWeight();
        window.pcr.META.forEach(head => {
            if (head !== "全部") {
                if (i % 2) {
                    window.pcr.weights[head].w = k * window.pcr.remainList.me[head].n;
                    Object.keys(window.pcr.allList.npc[head]).forEach(tail => {
                        window.pcr.weights[head].w += temp[tail].w;
                    });
                } else {
                    window.pcr.weights[head].w = k * window.pcr.remainList.npc[head].n;
                    Object.keys(window.pcr.allList.me[head]).forEach(tail => {
                        window.pcr.weights[head].w += temp[tail].w;
                    });
                }
            }
        });
    }
}

function isMatchWord(e, selectWord) {
    if (selectWord === null || selectWord === '全部' || e.head === selectWord) {
        return true;
    }
    return window.pcr.SAME_META.has(selectWord) && window.pcr.SAME_META.has(e.head);
}

function draw(configArray) {
    const gameDiv = $('#game');
    gameDiv.empty();
    configArray.forEach(config => {
        gameDiv.append($(`<div type="${config.type}" head="${config.head}" tail="${config.tail}" data-name="${config.name}" data-icon-id="${config.iconID}">
            <div class="icon ${config.type}" icon-id="${config.iconID}">
                ${isClicked(config.name, config.iconID) ? '<img src="assets/dui.png" class="clicked"/>' : ""}
                ${window.pcr.showName ? `<span class="text">${config.name}</span>` : ''}
            </div>
            ${window.pcr.sortIf ? '' : `<div>${window.pcr.weights[config.tail].w}</div>`}
            </div>`).mousedown((e) => {
            switch (e.which) {
                case 1:
                    if (!isClicked(e.currentTarget.getAttribute('data-name'), e.currentTarget.getAttribute('data-icon-id'))) {
                        window.pcr.remainList.me[e.currentTarget.getAttribute('head')].n--;
                        if (e.currentTarget.getAttribute('type') !== 'puricone') {
                            window.pcr.remainList.npc[e.currentTarget.getAttribute('head')].n--;
                        }
                    }
                    addClickHistory(
                        e.currentTarget.getAttribute('data-name'), 
                        e.currentTarget.getAttribute('data-icon-id')
                    );
                    if (window.pcr.editClickHistory) {
                        reProcess();
                    } else {
                        process(e.currentTarget.getAttribute('tail'));
                    }
                    break;
                case 3:
                    if (window.pcr.editClickHistory) {
                        if (isClicked(e.currentTarget.getAttribute('data-name'), e.currentTarget.getAttribute('data-icon-id'))) {
                            window.pcr.remainList.me[e.currentTarget.getAttribute('head')].n++;
                            if (e.currentTarget.getAttribute('type') !== 'puricone') {
                                window.pcr.remainList.npc[e.currentTarget.getAttribute('head')].n++;
                            }
                        }
                        removeClickHistory(
                            e.currentTarget.getAttribute('data-name'), 
                            e.currentTarget.getAttribute('data-icon-id')
                        );
                        reProcess();
                    } else {
                        process(e.currentTarget.getAttribute('tail'));
                    }
                    break;
                case 2:
                    break;
                default:
                    break;
            }
        }).bind('contextmenu', e => false)); // 为了支持右键点击, 禁用右键菜单
    });
}

function addClickHistory(name, iconID) {
    if (isClicked(name, iconID)) {
        return;
    }
    window.pcr.clickHistory.add(iconID + name);
    localStorage.setItem("clickedHistory", JSON.stringify(Array.from(window.pcr.clickHistory)));
}

function removeClickHistory(name, iconID) {
    if (!isClicked(name, iconID)) {
        return
    }
    window.pcr.clickHistory.delete(iconID + name);
    localStorage.setItem("clickedHistory", JSON.stringify(Array.from(window.pcr.clickHistory)));
}

function isClicked(name, iconID) {
    return window.pcr.clickHistory.has(iconID + name);
}