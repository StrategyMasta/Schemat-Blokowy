function dragElement(el, engine) {
    let posX = 0, posY = 0, x = 0, y = 0;
    el.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        if(el.className == "start" && document.getElementsByClassName("start").length == 2 && el.style.opacity != "1")
            return;
        if(el.className == "stop" && document.getElementsByClassName("stop").length == 2 && el.style.opacity != "1")
            return;
        if(e.target == document.getElementById("cursor") || e.target == document.getElementById("cable") || e.target == document.getElementById("eraser"))
            return;
        if(document.getElementById("cursor").style.border == "none")
            return;
        if(el.dataset.linked == "true") {
            el.style.opacity = 1;
            el.dataset.linked = false;
            createBlock(el.className, engine);
        }
        if(el.dataset.linked) el.style.zIndex = 2;

        if(el.tagName == "CANVAS" && engine.usedLinkers(el)) {
            engine.needsCheck = true;
        }

        x = e.clientX;
        y = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
  
    function elementDrag(e) {
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
        if(el.style.zIndex == 2) el.style.zIndex = -1;
        if(el.tagName == "CANVAS" && engine.usedLinkers(el))
            engine.needsCheck = true;

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

            document.getElementsByName("true")[0].value = ifValue?.true || "Góra";
            document.getElementsByName("false")[0].value = ifValue?.false || "Góra";
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

//function spellCheck(e) {
    //console.log("Changed!");
//}

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

    canvas.addEventListener("mousedown", mouseDown);
    canvas.addEventListener("mouseup", mouseUp);
    canvas.addEventListener("mousemove", mouseMove);

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
        cables = [];
    }
}

function erase(canvas, engine) {
    canvas.addEventListener("click", e => engine.getCableByDist(e.clientX, e.clientY));
}

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
    document.body.removeChild(el);
}