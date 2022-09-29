const engine = (function() {
    let priv = new WeakMap();
    let _ = instance => priv.get(instance);

    class Engine {
        constructor() {
            var privateMembers = {
                elements: [],
                size: 1,
                cables: []
            };

            priv.set(this, privateMembers);
        }

        add(el) {
            const posX = el.style.left.slice(0, el.style.left.length - 2) * 1;
            const posY = el.style.top.slice(0, el.style.top.length - 2) * 1;

            const isParal = (el.className == "wypiszWpisz" ? 15 : 5);
            _(this).elements.push({
                el,
                text: "",
                linkers: [
                    {used: false, up: true, up2: true, x: posX + el.width/2, y: posY + 5},
                    {used: false, up: false, up2: false, x: posX + el.width - isParal, y: posY + el.height/2},
                    {used: false, up: true, up2: false, x: posX + el.width/2, y: posY + el.height - 5},
                    {used: false, up: false, up2: true, x: posX + isParal, y: posY + el.height/2}
                ]
            });
        }

        addCable(cable, el1, el2, arrow) {
            _(this).cables.push({
                cable,
                from: el1,
                to: el2,
                arrow
            });
        }

        set size(s) {
            _(this).size = s;
        }

        setSize(canvas) {
            canvas.width = 150 * _(this).size;
            canvas.height = 80 * _(this).size;
        }

        draw(ctx, fill = true) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#000";
            ctx.stroke();
            ctx.fillStyle = "#fff";
            if(fill) ctx.fill();
        }

        write(text, canvas, size = 30) {
            const ctx = canvas.getContext("2d");
        
            ctx.fillStyle = "#000";
            ctx.font = `${size}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        }

        ellipse(canvas) {
            const ctx = canvas.getContext("2d");

            ctx.beginPath();
            ctx.ellipse(canvas.width / 2, canvas.height / 2, 70, 35, 0, 0, Math.PI * 2);

            this.draw(ctx);
        }

        parallelogram(canvas) {
            const ctx = canvas.getContext("2d");

            ctx.beginPath();
            ctx.moveTo(5, canvas.height - 5);
            ctx.lineTo(canvas.width - 25, canvas.height - 5);
            ctx.lineTo(canvas.width - 5, 5);
            ctx.lineTo(25, 5);
            ctx.lineTo(5, canvas.height - 5);

            this.draw(ctx);
        }

        rect(canvas) {
            const ctx = canvas.getContext("2d");

            ctx.lineWidth = 1;
            ctx.strokeStyle = "#000";
            ctx.fillStyle = "#fff";
            ctx.fillRect(5, 5, canvas.width - 10, canvas.height - 10);
            ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
        }

        rhombus(canvas) {
            const ctx = canvas.getContext("2d");

            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 5);
            ctx.lineTo(canvas.width - 5, canvas.height / 2);
            ctx.lineTo(canvas.width / 2, canvas.height - 5);
            ctx.lineTo(5, canvas.height / 2);
            ctx.lineTo(canvas.width / 2, 5);

            this.draw(ctx);
        }

        linker(canvas) {
            const ctx = canvas.getContext("2d");
            const { linkers } = _(this).elements.find(item => Object.is(canvas, item.el));

            const posX = canvas.style.left.slice(0, canvas.style.left.length - 2) * 1;
            const posY = canvas.style.top.slice(0, canvas.style.top.length - 2) * 1;

            for(let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.arc(linkers[i].x - posX, linkers[i].y - posY, 3, 0, Math.PI * 2);

                this.draw(ctx);
            }
        }

        removeLinkers(canvas) {
            const ctx = canvas.getContext("2d");
            const canvasCopy = _(this).elements.find(item => Object.is(canvas, item.el));

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this[canvas.className](canvas, canvasCopy.text);
        }

        findElement(x, y) {
            for(let item of _(this).elements)
                for(let i = 0; i < 4; i++)
                    if(Math.abs(item.linkers[i].x - x) <= 5 && Math.abs(item.linkers[i].y - y) <= 5)
                        return item.el;

            return undefined;
        }

        findLinker(x, y) {
            for(let item of _(this).elements)
                for(let i = 0; i < 4; i++)
                    if(Math.abs(item.linkers[i].x - x) <= 5 && Math.abs(item.linkers[i].y - y) <= 5)
                        return item.linkers[i];

            return undefined;
        }

        setLinkers(el, x, y) {
            const canvas = _(this).elements.find(item => Object.is(el, item.el));
            const isParal = (el.className == "wypiszWpisz" ? 15 : 5);

            canvas.linkers[0].x = x + el.width/2;
            canvas.linkers[0].y = y + 5;

            canvas.linkers[1].x = x + el.width - isParal;
            canvas.linkers[1].y = y + el.height/2;

            canvas.linkers[2].x = x + el.width/2;
            canvas.linkers[2].y = y + el.height - 5;

            canvas.linkers[3].x = x + isParal;
            canvas.linkers[3].y = y + el.height/2;
        }

        showAllLinkers() {
            for(let el of _(this).elements)
                this.linker(el.el);
        }

        removeAllLinkers() {
            for(let el of _(this).elements)
                this.removeLinkers(el.el);
        }

        showCables() {
            const canvas = document.getElementById("cables");
            const ctx = canvas.getContext("2d");

            for(let cables of _(this).cables) {
                ctx.beginPath();
                ctx.moveTo(cables.cable[0].x, cables.cable[0].y);

                for(let i = 1; i < cables.cable.length; i++)
                    ctx.lineTo(cables.cable[i].x, cables.cable[i].y);
                
                ctx.lineTo(cables.arrow[0].x, cables.arrow[0].y);
                ctx.moveTo(cables.cable[cables.cable.length-1].x, cables.cable[cables.cable.length-1].y);
                ctx.lineTo(cables.arrow[1].x, cables.arrow[1].y);
                
                this.draw(ctx, false);
            }
        }

        arrow(canvas) {
            const ctx = canvas.getContext("2d");

            ctx.beginPath();
            ctx.moveTo(20, canvas.height/2);
            ctx.lineTo(canvas.width - 20, canvas.height/2);
            ctx.lineTo(canvas.width - 26, canvas.height/2 - 6);
            ctx.moveTo(canvas.width - 20, canvas.height/2);
            ctx.lineTo(canvas.width - 26, canvas.height/2 + 6);

            this.draw(ctx, false);
        }

        start(canvas) {
            this.setSize(canvas);
            this.ellipse(canvas);
            this.write("Start", canvas);
        }

        stop(canvas) {
            this.setSize(canvas);
            this.ellipse(canvas);
            this.write("Stop", canvas);
        }

        poleObliczeniowe(canvas) {
            this.setSize(canvas);
            this.rect(canvas);
            this.write("Pole Obliczeniowe", canvas, 15);
        }

        wypiszWpisz(canvas) {
            this.setSize(canvas);
            this.parallelogram(canvas);
            this.write("Wypisz/Wpisz", canvas, 15);
        }

        if(canvas) {
            this.setSize(canvas);
            this.rhombus(canvas);
            this.write("If", canvas);
        }
    }

    return Engine;

})();