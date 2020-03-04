window.pcr = new Object;
window.pcr.clickHistory = new Set(JSON.parse(localStorage.getItem("clickedHistory") || '[]'));

$.ajax('assets/data.json')
    .done(data => {
        window.pcr.META = data.meta;
        window.pcr.DATA_ARRAY = data.data;
        window.pcr.SAME_META = [];
        data.sameMeta.forEach(arr => window.pcr.SAME_META.push(new Set(arr)));
        initData();
    });

$("#clearClickHistory").click(e => {
    localStorage.removeItem('clickedHistory');
    window.pcr.clickHistory.clear();
    reProcess();
});

$("#showName").click(e => {
    window.pcr.showName = e.currentTarget.checked;
    reProcess();
});

$("#editClickHistory").click(e => {
    window.pcr.editClickHistory = e.currentTarget.checked;
    reProcess();
});

function initData() {
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
    draw(dataArray);
}

function sort(dataArray) {
    // TODO 按照分数以及是否点击过排序
    return dataArray;
}

function isMatchWord(e, selectWord) {
    if (selectWord === null || selectWord === '全部' || e.head === selectWord) {
        return true;
    }
    return window.pcr.SAME_META.some(set => set.has(selectWord) && set.has(e.head));
}

function draw(configArray) {
    const gameDiv = $('#game');
    gameDiv.empty();
    configArray.forEach(config => {
        gameDiv.append($(`<div tail="${config.tail}" data-name="${config.name}" data-icon-id="${config.iconID}">
            <div class="icon" icon-id="${config.iconID}">
                ${isClicked(config.name, config.iconID) ? '<img src="assets/dui.png" class="clicked"/>' : ""}
                ${window.pcr.showName ? `<span class="text">${config.name}</span>` : ''}
            </div>
            </div>`).mousedown((e) => {
            switch (e.which) {
                case 1:
                    if (window.pcr.editClickHistory) {
                        addClickHistory(e.currentTarget.getAttribute('data-name'), e.currentTarget.getAttribute('data-icon-id'));
                        reProcess();
                    } else {
                        addClickHistory(e.currentTarget.getAttribute('data-name'), e.currentTarget.getAttribute('data-icon-id'));
                        process(e.currentTarget.getAttribute('tail'));
                    }
                    break;
                case 3:
                    if (window.pcr.editClickHistory) {
                        removeClickHistory(e.currentTarget.getAttribute('data-name'), e.currentTarget.getAttribute('data-icon-id'));
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