window.pcr = new Object;
window.pcr.clickHistory = new Set(JSON.parse(localStorage.getItem("clickedHistory") || '[]'));
window.pcr.showName = false;
window.pcr.editClickHistory = false;
window.pcr.sortIf = true;

$.ajax('assets/data.json').done(data => {
    window.pcr.META = data.meta;
    window.pcr.DATA_ARRAY = data.data;
    window.pcr.SAME_META = new Set(data.sameMeta[0]);
    // data.sameMeta.forEach(arr => window.pcr.SAME_META.push(new Set(arr)));
    initData();
});

function count(name, iconID, head, tail, type) {
    if (!isClicked(name, iconID)) {
        let obj = window.pcr.remainingList[head]["me"];
        addToObj(obj, tail);
        if (type !== "puricone") {
            obj = window.pcr.remainingList[head]["npc"];
            addToObj(obj, tail);
        }
    } else {
        let obj = window.pcr.remainingList[head]["me"];
        removeFromObj(obj, tail);
        if (type !== "puricone") {
            obj = window.pcr.remainingList[head]["npc"];
            removeFromObj(obj, tail);
        }
    }
}

function addToObj(obj, tail) {
    obj["total"]++;
    if (!obj["list"][tail]) {
        obj["list"][tail] = 0;
    }
    obj["list"][tail]++;
}

function removeFromObj(obj, tail) {
    obj["total"]--;
    obj["list"][tail]--;
    if (obj["list"][tail] == 0) {
        delete obj["list"]["tail"];
    }
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
    window.pcr.remainingList = {};
    let t = { "me": { "list": {}, "total": 0 }, "npc": { "list": {}, "total": 0 } };
    window.pcr.META.forEach(e => {
        if (window.pcr.SAME_META.has(e)) {
            window.pcr.remainingList[e] = t;
        } else if (e !== "全部") {
            window.pcr.remainingList[e] = { "me": { "list": {}, "total": 0 }, "npc": { "list": {}, "total": 0 } };
        }
    });
    window.pcr.DATA_ARRAY.forEach(e => {
        if (!isClicked(e.name, e.iconID)) {
            count(e.name, e.iconID, e.head, e.tail, e.type);
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
    if (!window.pcr.sortIf) {
        window.pcr.preDataArray = sort(window.pcr.preDataArray)
    }
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
    draw(dataArray);
}

function sort(dataArray) {
    dataArray.forEach(config => {
        config.weight = isClicked(config.name, config.iconID) ? 0 : 1;
        config.weight *= 10;
        config.weight += window.pcr.remainingList[config.tail]["npc"]["total"];
        config.weight *= 10;
        Object.keys(window.pcr.remainingList[config.tail]["npc"]["list"]).forEach(tail => {
            config.weight += window.pcr.remainingList[tail]["me"]["total"];
        });
    });
    if (!window.pcr.sortIf) {
        dataArray.sort((a, b) => b.weight - a.weight);
    }
    return dataArray;
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
            ${window.pcr.sortIf ? '' : `<div>${config.weight}</div>`}
            </div>`).mousedown((e) => {
            switch (e.which) {
                case 1:
                    if (window.pcr.editClickHistory) {
                        addClickHistory(
                            e.currentTarget.getAttribute('data-name'), 
                            e.currentTarget.getAttribute('data-icon-id')
                        );
                        count(
                            e.currentTarget.getAttribute('data-name'), 
                            e.currentTarget.getAttribute('data-icon-id'), 
                            e.currentTarget.getAttribute('head'),
                            e.currentTarget.getAttribute('tail'),
                            e.currentTarget.getAttribute('type')
                        );
                        reProcess();
                    } else {
                        addClickHistory(
                            e.currentTarget.getAttribute('data-name'), 
                            e.currentTarget.getAttribute('data-icon-id')
                        );
                        count(
                            e.currentTarget.getAttribute('data-name'), 
                            e.currentTarget.getAttribute('data-icon-id'), 
                            e.currentTarget.getAttribute('head'),
                            e.currentTarget.getAttribute('tail'),
                            e.currentTarget.getAttribute('type')
                        );
                        process(e.currentTarget.getAttribute('tail'));
                    }
                    break;
                case 3:
                    if (window.pcr.editClickHistory) {
                        removeClickHistory(
                            e.currentTarget.getAttribute('data-name'), 
                            e.currentTarget.getAttribute('data-icon-id')
                        );
                        count(
                            e.currentTarget.getAttribute('data-name'), 
                            e.currentTarget.getAttribute('data-icon-id'), 
                            e.currentTarget.getAttribute('head'),
                            e.currentTarget.getAttribute('tail'),
                            e.currentTarget.getAttribute('type')
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