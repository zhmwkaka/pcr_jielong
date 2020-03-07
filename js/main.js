window.pcr = new Object;
window.pcr.clickHistory = new Set(JSON.parse(localStorage.getItem("clickedHistory") || '[]'));
window.pcr.showName = false;
window.pcr.editClickHistory = false;
window.pcr.sortIf = true;
window.pcr.showNPCweight = false;
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
    process(window.pcr.preWord);
});

$("#showNPCweight").click(e => {
    window.pcr.showNPCweight = e.currentTarget.checked;
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
    initWeight();   
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
    draw(window.pcr.preDataArray);
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
        dataArray.sort((a, b) => {
            if (!isClicked(a.name, a.iconID) && isClicked(b.name, b.iconID)) {
                return -1;
            }
            if (!isClicked(b.name, b.iconID) && isClicked(a.name, a.iconID)) {
                return 1;
            }
            return window.pcr.weights.me[b.tail].w - window.pcr.weights.me[a.tail].w;
        });
    }
    return dataArray;
}

function initWeight() {
    window.pcr.weights = { "me": {}, "npc": {} };

    let tme = { "w": 0 };
    let tnpc = { "w": 0 };
    window.pcr.META.forEach(e => {
        if (window.pcr.SAME_META.has(e)) {
            window.pcr.weights.me[e] = tme;
            window.pcr.weights.npc[e] = tnpc;
        } else if (e !== "全部") {
            window.pcr.weights.me[e] = { "w": 0 };
            window.pcr.weights.npc[e] = { "w": 0 };
        }
    });
}

function computeWeight() {
    initWeight();

    for (let i = 0, k = 1; i < window.pcr.nRecursive; i++, k *= 1.5) {
        if (i % 2) {
            window.pcr.META.forEach(head => {
                if (window.pcr.allList.me[head]) {
                    window.pcr.weights.npc[head].w = k * window.pcr.remainList.me[head].n;
                    let N = 0;
                    let sum = 0;
                    Object.keys(window.pcr.allList.me[head]).forEach(tail => {
                        sum += window.pcr.weights.me[tail].w * window.pcr.allList.me[head][tail];
                        N += window.pcr.allList.me[head][tail];
                    })
                    window.pcr.weights.npc[head].w += sum / N;
                } else if (head !== "全部") {
                    window.pcr.weights.npc[head].w = 0;
                }
            });
        } else {
            window.pcr.META.forEach(head => {
                if (window.pcr.allList.npc[head]) {
                    window.pcr.weights.me[head].w = k * window.pcr.remainList.npc[head].n;
                    let N = 0;
                    let sum = 0;
                    Object.keys(window.pcr.allList.npc[head]).forEach(tail => {
                        sum += window.pcr.weights.npc[tail].w * window.pcr.allList.npc[head][tail];
                        N += window.pcr.allList.npc[head][tail];
                    });
                    window.pcr.weights.me[head].w += sum / N;
                } else if (head !== "全部") {
                    window.pcr.weights.me[head].w = 0;
                }
            });
        }
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

    let me_max = 0, npc_max = 0;
    configArray.forEach(config => {
        if (window.pcr.weights.me[config.tail].w > me_max) {
            me_max = window.pcr.weights.me[config.tail].w;
        }
        if ((config.type === 'puricone' ? 0 : window.pcr.weights.npc[config.tail].w) > npc_max) {
            npc_max = (config.type === 'puricone' ? 0 : window.pcr.weights.npc[config.tail].w);
        }
    });
    configArray.forEach(config => {
        let me_weight = window.pcr.weights.me[config.tail].w;
        let npc_weight = (config.type === 'puricone' ? 0 : window.pcr.weights.npc[config.tail].w);
        gameDiv.append($(`<div type="${config.type}" head="${config.head}" tail="${config.tail}" data-name="${config.name}" data-icon-id="${config.iconID}">
            <div class="icon ${config.type}" icon-id="${config.iconID}">
                ${isClicked(config.name, config.iconID) ? '<img src="assets/dui.png" class="clicked"/>' : ""}
                ${window.pcr.showName ? '<span class="text">' + config.name + '</span>' : ''}
            </div><div>
            ${(window.pcr.sortIf ? '' : ( 
                '<span' + (me_weight == me_max ? ' style="color: limegreen;" ' : '') +'>' + me_weight.toFixed(1) + '</span>') + 
                (window.pcr.showNPCweight ? '/<span' + (npc_weight == npc_max ? ' style="color: deeppink;" ' : '') + '>' + npc_weight.toFixed(1) + '</span>' : ''))
            }</div></div>`).mousedown((e) => {
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
                        if (window.pcr.sortIf) {
                            reProcess();
                        } else {
                            process(window.pcr.preWord);
                        }
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
                        if (window.pcr.sortIf) {
                            reProcess();
                        } else {
                            process(window.pcr.preWord);
                        }
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

function __addAllHistory() {
    window.pcr.DATA_ARRAY.forEach(e => {
        window.pcr.clickHistory.add(e.iconID + e.name);
    });
    localStorage.setItem("clickedHistory", JSON.stringify(Array.from(window.pcr.clickHistory)));
}