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
        input.style.display = "inline";
        input.children[0].focus();

        apply.onclick = function() {
            engine.setText(el, text.value);
            input.style.display = "none";
        }

        cancel.onclick = function() {
            input.style.display = "none";
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
        const linker2 = engine.findLinker(e.clientX, e.clientY);
        const el2 = engine.findElement(e.clientX, e.clientY);

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        //connection validation

        if(!linker1) return;
        if(!linker2 || Object.is(el1, el2)) {
            cables = [];
            return;
        }
        if(!engine.validateCable(el1, linker1, linker2)) {
            cables = [];
            return;
        }

        let arrow;
        [cables, arrow] = engine.createCable(linker1, linker2, cables);

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