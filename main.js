(function(){
    const Engine = new engine();
    const bloki = document.getElementById("bloki");
    // const tools = document.getElementById("tools");
    const output = document.getElementById("output");
    const trash = document.getElementById("trash");
    const cables = document.getElementById("cables");
    const previewC = document.getElementById("preview");
    // const cursor = document.getElementById("cursor");
    // const cable = document.getElementById("cable");
    // const eraser = document.getElementById("eraser");
    const theme = document.getElementById("theme");
    const try1 = document.getElementById("try");
    const run = document.getElementById("run");
    const speed = document.getElementById("speed");
    const importEl = document.getElementById("import");
    const exportEl = document.getElementById("export");
    const anuluj2 = document.getElementById("anuluj2");
    const anuluj3 = document.getElementById("anuluj3");
    const exitManual = document.getElementById("exitManual");
    const openManual = document.getElementById("openManual");
    const content = document.getElementById("content");
    //const text = document.getElementById("text");

    // cursor.width = 100;
    // cursor.height = 40;
    // cable.width = 100;
    // cable.height = 40;
    // eraser.width = 100;
    // eraser.height = 40;
    cables.width = innerWidth;
    cables.height = innerHeight;
    previewC.width = innerWidth;
    previewC.height = innerHeight;

    // dragElement(bloki, Engine);
    // dragElement(tools, Engine);
    // dragElement(output, Engine);
    dragElement(trash, Engine);

    preview(previewC, Engine);
    eraseEvent(Engine);
    // setImportAndExport(importEl, exportEl, Engine);
    // erase(cables, Engine);
    changeTheme(theme, Engine);
    runCode(try1, false, Engine);
    runCode(run, true, Engine);

    updateExportNames();

    // Engine.arrow(cable);
    // Engine.cursor(cursor);
    // Engine.eraser(eraser);

    content.appendChild(document.getElementsByClassName("content")[0].content.cloneNode(true));

    // Przycisk Powrót
    content.children[1].children[1].children[0].addEventListener("click", function() {
        changeSlide(false, (infoMeter.value / 20) - 2);
    });

    // Przycisk Dalej
    content.children[1].children[1].children[1].addEventListener("click", function() {
        changeSlide(true, infoMeter.value / 20);
    });

    importEl.addEventListener("click", function() {
        const saves = document.getElementById("saves");
        saves.style.display = saves.style.display = "inline";
        saves.dataset.type = "import";
    });

    exportEl.addEventListener("click", function() {
        const saves = document.getElementById("saves");
        saves.style.display = saves.style.display = "inline";
        saves.dataset.type = "export";
    });

    anuluj2.addEventListener("click", function() {
        const saves = document.getElementById("saves");
        saves.style.display = "none";
    });

    anuluj3.addEventListener("click", function() {
        const confirmWrapper = document.getElementById("confirmWrapper");
        confirmWrapper.style.display = "none";
    });

    exitManual.addEventListener("click", function() {
        const manual = document.getElementById("manual");
        manual.style.display = "none";
    });

    openManual.addEventListener("click", function() {
        const manual = document.getElementById("manual");
        manual.style.display = "block";
    });

    const saveEls = document.getElementsByClassName("save");

    [...saveEls].forEach(el => el.addEventListener("click", function() {
        el.parentElement.dataset.type == "import" ? setImport(el, Engine) : setExport(el, Engine);
    }));

    speed.addEventListener("click", function() {
        if(Engine.getSpeed() != 8) Engine.doubleTheSpeed();
        else Engine.resetSpeed();

        speed.innerHTML = Engine.getSpeed() + "x";
    });

    window.addEventListener("resize", function() {
        previewC.width = innerWidth;
        previewC.height = innerHeight;
        cables.width = innerWidth;
        cables.height = innerHeight;
        Engine.showCables();
    });

    // function animate() {
    //     Engine.showCables();
    //     requestAnimationFrame(animate);
    // }
    // animate();

    //text.addEventListener("keypress", spellCheck);
    //text.addEventListener("keydown", e => e.key == "Backspace" ? spellCheck(e) : 0);

    // cursor.addEventListener("click", function() {
    //     previewC.style.pointerEvents = "none";
    //     cables.style.pointerEvents = "none";
    //     for(let i of [cursor, cable, eraser]) i.style.border = "none";
    //     cursor.style.border = "1px solid var(--theme-fore)";
    //     Engine.removeAllLinkers();
    // });

    // cable.addEventListener("click", function() {
    //     previewC.style.pointerEvents = "all";
    //     cables.style.pointerEvents = "none";
    //     for(let i of [cursor, cable, eraser]) i.style.border = "none";
    //     cable.style.border = "1px solid var(--theme-fore)";
    //     Engine.showAllLinkers();
    // });

    // eraser.addEventListener("click", function() {
    //     previewC.style.pointerEvents = "none";
    //     cables.style.pointerEvents = "all";
    //     for(let i of [cursor, cable, eraser]) i.style.border = "none";
    //     eraser.style.border = "1px solid var(--theme-fore)";
    //     Engine.removeAllLinkers();
    // });

    for(let item of bloki.childNodes[5].children) {
        createBlock(item.id, Engine);
        Engine[item.id](item);
    }
})();