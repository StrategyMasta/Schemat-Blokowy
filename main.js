(function(){
    const Engine = new engine();
    const bloki = document.getElementById("bloki");
    const tools = document.getElementById("tools");
    const output = document.getElementById("output");
    const trash = document.getElementById("trash");
    const cables = document.getElementById("cables");
    const previewC = document.getElementById("preview");
    const cable = document.getElementById("cable");

    let on = false;

    cable.width = 100;
    cable.height = 40;
    cables.width = innerWidth;
    cables.height = innerHeight;
    previewC.width = innerWidth;
    previewC.height = innerHeight;

    dragElement(bloki, Engine);
    dragElement(tools, Engine);
    dragElement(output, Engine);
    dragElement(trash, Engine);

    preview(previewC, Engine);
    Engine.arrow(cable);

    function animate() {
        Engine.showCables();
        requestAnimationFrame(animate);
    }
    animate();

    cable.addEventListener("click", function() {
        on = !on;
        previewC.style.pointerEvents = (on ? "all" : "none");
        if(on) Engine.showAllLinkers();
        else Engine.removeAllLinkers();
    });

    for(let item of bloki.childNodes[5].children) {
        createBlock(item.id, Engine);
        Engine[item.id](item);
    }
})();