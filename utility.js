function dragElement(el, engine) {
    let posX = 0, posY = 0, x = 0, y = 0;
    el.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();

        if(e.button == 2 && el.dataset.linked == "true")
            return;
        if(e.button == 2 && el.tagName == "CANVAS") {
            deleteBlock(el, engine);
            el = undefined;
            return;
        }

        if(engine.findLinker(e.clientX, e.clientY))
            return;
        if(el.className == "start" && document.getElementsByClassName("start").length == 2 && el.style.opacity != "1")
            return;
        if(el.className == "stop" && document.getElementsByClassName("stop").length == 2 && el.style.opacity != "1")
            return;
        if(e.target == document.getElementById("import") || e.target == document.getElementById("export"))
            return;
        // if(e.target == document.getElementById("cursor") || e.target == document.getElementById("cable") || e.target == document.getElementById("eraser"))
        //     return;
        // if(document.getElementById("cursor").style.border == "none")
        //     return;
        if(e.target == document.getElementById("try") || e.target == document.getElementById("run") || e.target == document.getElementById("speed"))
            return;
        
        if(el.dataset.linked == "true") {
            el.style.opacity = 1;
            el.dataset.linked = false;
            engine.setLinkers(el, el.offsetLeft, el.offsetTop);
            engine[el.className](el);
            engine.linker(el);
            createBlock(el.className, engine);
        }
        if(el.dataset.linked) el.style.zIndex = 2;

        if(el.tagName == "CANVAS" && engine.usedLinkers(el)) {
            // engine.needsCheck = true;
            engine.showCables();
        }

        // Check For New Cable Here, And Put Checking For Deleting A Cable In window.mousedown

        // Check If The User Wants To Delete A Cable
        // if(engine.getCableByDist(e.clientX, e.clientY, "delete"))
        //     return;
        // Check If The User Wants To Create A Cable

        x = e.clientX;
        y = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
  
    function elementDrag(e) {
        if(!el) return;
        e.preventDefault();
        posX = x - e.clientX;
        posY = y - e.clientY;
        x = e.clientX;
        y = e.clientY;
        el.style.top = (el.offsetTop - posY) + "px";
        el.style.left = (el.offsetLeft - posX) + "px";

        if(el.tagName == "CANVAS") {
            const posX = el.style.left.slice(0, el.style.left.length - 2) * 1;
            const posY = el.style.top.slice(0, el.style.top.length - 2) * 1;
            engine.setLinkers(el, posX, posY);
            //aktualizowanie połączeń tutaj

            engine.updateCables(el);
            engine.showCables();
        }

        if(el.id == "bloki") {
            const canvases = document.getElementsByTagName("canvas");
            for(let i = 0; i < canvases.length; i++) {
                if(canvases[i].dataset.linked == "true") {
                    canvases[i].style.top = document.getElementById(canvases[i].className).getBoundingClientRect().top + "px";
                    canvases[i].style.left = (document.getElementById("bloki").getBoundingClientRect().left + 25) + "px";
                }
            }
        }
    }
  
    function closeDragElement() {
        if(!el) return;
        if(el.style.zIndex == 2) el.style.zIndex = -1;
        if(el.tagName == "CANVAS" && engine.usedLinkers(el)) {
            // engine.needsCheck = true;
            engine.showCables();
        }

        const elPos = el.getBoundingClientRect();
        const trash = document.getElementById("trash").getBoundingClientRect();
        if(
            el.tagName == "CANVAS" && 
            Math.sqrt((elPos.x + elPos.width/2 - (trash.x + trash.width/2)) ** 2 + 
            (elPos.y + elPos.height/2 - (trash.y + trash.height/2)) ** 2) <= 80
        ) deleteBlock(el, engine);

        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function doubleClick(el, engine) {
    if(el.className != "start" && el.className != "stop") 
        el.addEventListener("dblclick", dblClick);

    function dblClick() {
        const input = document.getElementById("input");
        const text = document.getElementById("text");
        const apply = document.getElementById("potwierdz");
        const cancel = document.getElementById("anuluj");
    
        text.value = engine.getText(el);
        if(el.className == "if") {
            let ifValue = engine.getIfValue(el);

            text.insertAdjacentHTML("afterend", 
                `<div class="wrapper" id="bool">
                    <label>TRUE <select name="true">
                        <option value="Góra">Góra</option>
                        <option value="Prawo">Prawo</option>
                        <option value="Lewo">Lewo</option>
                        <option value="Dół">Dół</option>
                    </select></label>

                    <label>FALSE <select name="false">
                    <option value="Góra">Góra</option>
                    <option value="Prawo">Prawo</option>
                    <option value="Lewo">Lewo</option>
                    <option value="Dół">Dół</option>
                </select></label>
                </div>`);

            const opt1 = document.getElementsByName("true")[0];
            const opt2 = document.getElementsByName("false")[0];

            opt1.value = ifValue.true;
            opt2.value = ifValue.false;

            [...opt1.children].find(item => item.value == opt2.value).disabled = true;
            [...opt2.children].find(item => item.value == opt1.value).disabled = true;

            opt1.onchange = function() {
                for(let item of opt2.children) item.disabled = false;
                [...opt2.children].find(item => item.value == opt1.value).disabled = true;
            }
            opt2.onchange = function() {
                for(let item of opt1.children) item.disabled = false;
                [...opt1.children].find(item => item.value == opt2.value).disabled = true;
            }
            
            text.style.height = "70%";
        } else if(el.className == "wypiszWpisz") {
            let wypisz = engine.getWypisz(el) ?? true;

            text.insertAdjacentHTML("afterend", 
                `<div class="wrapper" id="bool">
                    <label>WYPISZ <input type="radio" name="bool2" ` + (wypisz ? "checked" : "") + ` /></label>
                    <label>WPISZ <input type="radio" name="bool2" ` + (!wypisz ? "checked" : "") + ` /></label>
                </div>`);
            text.style.height = "70%";
        }

        input.style.display = "inline";
        input.children[0].focus();

        apply.onclick = function() {
            let ifValue = null;
            let wypisz = null;

            if(el.className == "if") {
                ifValue = {
                    true: document.getElementsByName("true")[0].value,
                    false: document.getElementsByName("false")[0].value
                };
            } else if(el.className == "wypiszWpisz") {
                wypisz = document.getElementsByName("bool2")[0].checked;
            }

            engine.setText(el, text.value, {ifValue, wypisz});
            input.style.display = "none";
            text.style.height = "80%";
            if(el.className == "if" || el.className == "wypiszWpisz")
                document.getElementById("bool").remove();
        }

        cancel.onclick = function() {
            input.style.display = "none";
            text.style.height = "80%";
            if(el.className == "if" || el.className == "wypiszWpisz")
                document.getElementById("bool").remove();
        }
    }
}

function changeTheme(el, engine) {
    el.addEventListener("click", function() {
        const root = document.querySelector(":root");
        const data = getComputedStyle(root);
        const props = ["back", "fore", "shadow", "shadow2", "buttons", "buttons-hover", "footer"];
        const lightTheme = ["#fff", "#000", "#555", "rgba(55, 55, 55, 0.7)", "#ddd", "#ccc", "#333"];
        const darkTheme = ["#222", "#fff", "#aaa", "rgba(55, 55, 55, 0.7)", "#222", "#333", "#ccc"];
        const theme = data.getPropertyValue("--theme-fore").trim() == "#fff" ? lightTheme : darkTheme;

        for(let i = 0; i < props.length; i++)    
            root.style.setProperty(`--theme-${props[i]}`, theme[i]);
        
        engine.changeTheme();
    });
}

// Check For Deleting A Cable
function eraseEvent(engine) {
    document.addEventListener("mousedown", function(e) {
        if(e.button == 2) {
            e.preventDefault();
            if(engine.getCableByDist(e.clientX, e.clientY, "delete"))
                return;
        }
    });
}

function setImport(el, engine) {
    const index = [...document.getElementsByClassName("save")].indexOf(el);
    const saveEl = document.getElementById("saves");

    saveEl.style.display = "none";
    engine.import(createBlock, deleteBlock, index);
}

function setExport(el, engine) {
    const index = [...document.getElementsByClassName("save")].indexOf(el);
    const saveEl = document.getElementById("saves");
    const exportEl = document.getElementById("confirmWrapper");
    const confirmEl = document.getElementById("confirmExport");
    const exportNameEl = document.getElementById("exportName");
    
    exportNameEl.value = "";
    exportEl.style.display = "inline";
    confirmEl.onclick = function() {
        saveEl.style.display = "none";
        exportEl.style.display = "none";
        setExportName(index, exportNameEl.value);
        updateExportNames();
        engine.export(index);
    }
}

function setExportName(index, name) {
    localStorage.setItem(`exportName${index}`, name);
}

function getExportNames(index) {
    return localStorage.getItem(`exportName${index}`);
}

function updateExportNames() {
    const saveEls = document.getElementsByClassName("save");

    [...saveEls].forEach((el, index) => el.innerText = getExportNames(index) ? getExportNames(index) : `Zapis ${index + 1}`);
}

//function spellCheck(e) {
    //console.log("Changed!");
//}

function tryCode(el, engine) {
    const root = document.querySelector(":root");
    const output = document.getElementById("output");

    el.addEventListener("click", click);

    function click() {
        root.style.pointerEvents = "none";
        output.innerHTML = `
            <h2>Wyjście</h2>
            <hr />
        `;
        engine.runCode(false);
    }
}

function mouseOver(canvas, engine) {
    canvas.addEventListener("mouseover", function() {
        engine.linker(canvas);
    });
}

function mouseOut(canvas, engine) {
    canvas.addEventListener("mouseout", function() {
        engine.removeLinkers(canvas);
    });
}

function preview(canvas, engine) {
    let cables = [];
    let linker1;
    let el1;

    window.addEventListener("mousedown", mouseDown);
    window.addEventListener("mouseup", mouseUp);
    window.addEventListener("mousemove", mouseMove);

    function mouseDown(e) {
        cables = [];
        cables.push({
            x: e.clientX,
            y: e.clientY
        });

        linker1 = engine.findLinker(e.clientX, e.clientY);
        el1 = engine.findElement(e.clientX, e.clientY);

        if(!linker1) return;

        cables[0] = {x: linker1.x, y: linker1.y};
    }

    function mouseMove(e) {
        cables[1] = {
            x: e.clientX,
            y: e.clientY
        };

        if(!linker1) return;

        if(!cables[0]) return;

        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(cables[0].x, cables[0].y);
        ctx.lineTo(cables[1].x, cables[1].y);

        engine.draw(ctx);
    }

    function mouseUp(e) {
        let linker2 = engine.findLinker(e.clientX, e.clientY);
        const el2 = engine.findElement(e.clientX, e.clientY);

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        //connection validation

        if(!linker1) return;
        if(engine.checkCableConnect(el1, linker1, e.clientX, e.clientY)) {
            cables = [];
            return;
        }
        if(!linker2 || Object.is(el1, el2)) {
            cables = [];
            return;
        }
        if(!engine.validateCable(el1, el2, linker1, linker2)) {
            cables = [];
            return;
        }

        let arrow;
        [cables, arrow, linker1, linker2] = engine.createCable(linker1, linker2, el1, el2, cables);

        engine.addCable(cables, el1, el2, arrow, [linker1, linker2]);
        engine.setUsed(linker1, linker2);
        engine.showCables();
        cables = [];
    }
}

// function erase(canvas, engine) {
//     canvas.addEventListener("click", e => engine.getCableByDist(e.clientX, e.clientY, "delete"));
// }

function createBlock(type, engine) {
    const el = document.createElement("CANVAS");
    el.style.position = "absolute";
    el.style.top = document.getElementById(type).getBoundingClientRect().top + "px";
    el.style.left = (document.getElementById("bloki").getBoundingClientRect().left + 25) + "px";
    el.style.zIndex = 2;
    el.style.opacity = 0;
    el.classList.add(type);
    el.dataset.linked = true;

    engine.add(el);
    engine[type](el);
    dragElement(el, engine);
    doubleClick(el, engine);
    mouseOver(el, engine);
    mouseOut(el, engine);
    document.body.appendChild(el);
}

function deleteBlock(el, engine) {
    engine.removeCables(el);
    engine.removeElement(el);
    engine.showCables();
    document.body.removeChild(el);
}