(function(){
    const Engine = new engine();
    const bloki = document.getElementById("bloki");
    const tools = document.getElementById("tools");
    const output = document.getElementById("output");
    const trash = document.getElementById("trash");
    const cables = document.getElementById("cables");
    const previewC = document.getElementById("preview");
    const cursor = document.getElementById("cursor");
    const cable = document.getElementById("cable");
    const eraser = document.getElementById("eraser");
    const theme = document.getElementById("theme");
    //const text = document.getElementById("text");

    cursor.width = 100;
    cursor.height = 40;
    cable.width = 100;
    cable.height = 40;
    eraser.width = 100;
    eraser.height = 40;
    cables.width = innerWidth;
    cables.height = innerHeight;
    previewC.width = innerWidth;
    previewC.height = innerHeight;

    dragElement(bloki, Engine);
    //dragElement(tools, Engine);
    //dragElement(output, Engine);
    dragElement(trash, Engine);

    preview(previewC, Engine);
    erase(cables, Engine);
    changeTheme(theme, Engine);

    Engine.arrow(cable);
    Engine.cursor(cursor);
    Engine.eraser(eraser);

    function animate() {
        Engine.showCables();
        requestAnimationFrame(animate);
    }
    animate();

    //text.addEventListener("keypress", spellCheck);
    //text.addEventListener("keydown", e => e.key == "Backspace" ? spellCheck(e) : 0);

    cursor.addEventListener("click", function() {
        previewC.style.pointerEvents = "none";
        cables.style.pointerEvents = "none";
        for(let i of [cursor, cable, eraser]) i.style.border = "none";
        cursor.style.border = "1px solid var(--theme-fore)";
        Engine.removeAllLinkers();
    });

    cable.addEventListener("click", function() {
        previewC.style.pointerEvents = "all";
        cables.style.pointerEvents = "none";
        for(let i of [cursor, cable, eraser]) i.style.border = "none";
        cable.style.border = "1px solid var(--theme-fore)";
        Engine.showAllLinkers();
    });

    eraser.addEventListener("click", function() {
        previewC.style.pointerEvents = "none";
        cables.style.pointerEvents = "all";
        for(let i of [cursor, cable, eraser]) i.style.border = "none";
        eraser.style.border = "1px solid var(--theme-fore)";
        Engine.removeAllLinkers();
    });

    for(let item of bloki.childNodes[5].children) {
        createBlock(item.id, Engine);
        Engine[item.id](item);
    }
})();