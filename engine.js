const engine = (function() {
    let priv = new WeakMap();
    let _ = instance => priv.get(instance);

    class Engine {
        constructor() {
            var privateMembers = {
                elements: [],
                size: 1,
                cables: [],
                changed: false,
                colors: {
                    fore: "#000",
                    back: "#fff",
                    text: "blue"
                }
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
                ifValue: {true: "Prawo", false: "Lewo"},
                wypisz: true,
                linkers: [
                    {used: false, up: true, up2: true, x: posX + el.width/2, y: posY + 5},
                    {used: false, up: false, up2: false, x: posX + el.width - isParal, y: posY + el.height/2},
                    {used: false, up: true, up2: false, x: posX + el.width/2, y: posY + el.height - 5},
                    {used: false, up: false, up2: true, x: posX + isParal, y: posY + el.height/2}
                ]
            });
        }

        addCable(cable, el1, el2, arrow, linkers) {
            _(this).cables.push({
                cable,
                from: el1,
                to: el2,
                arrow,
                linkers,
                crosses: []
            });
        }

        removeCables(el) {
            let cables = [];

            for(let cable of _(this).cables) {
                if(Object.is(cable.from, el)) {
                    _(this).elements.find(item => Object.is(item.el, cable.to)).linkers.find(item => Object.is(item, cable.linkers[1])).used = false;
                    cables.push(cable);
                } else if(Object.is(cable.to, el)) {
                    _(this).elements.find(item => Object.is(item.el, cable.from)).linkers.find(item => Object.is(item, cable.linkers[0])).used = false;
                    cables.push(cable);
                }
            }
            
            for(let cable of cables)
                _(this).cables.splice(_(this).cables.indexOf(cable), 1);
            
            this.needsCheck = true;
            setTimeout(() => this.needsCheck = false, 50);
        }

        removeElement(el) {
            _(this).elements.splice(_(this).elements.indexOf(_(this).elements.find(item => Object.is(item.el, el))), 1);
        }

        set size(s) {
            _(this).size = s;
        }

        setSize(canvas) {
            canvas.width = 150 * _(this).size;
            canvas.height = 80 * _(this).size;
        }

        getText(el) {
            return _(this).elements.find(elem => Object.is(elem.el, el)).text;
        }

        setText(el, text, options) {
            const originalEl = _(this).elements.find(elem => Object.is(elem.el, el));

            originalEl.text = text;

            if(options.ifValue)
                originalEl.ifValue = options.ifValue;
            else if(options.wypisz != null)
                originalEl.wypisz = options.wypisz;

            text = text.split("\n");

            const ctx = el.getContext("2d");
            el.width = text.reduce((sum, line) => Math.max(sum, ctx.measureText(line).width), 0) + (el.className == "wypiszWpisz" ? 60 : (el.className == "if" ? 46 : 30));
            el.height = text.length * (el.className == "if" ? 36 : 20) + 30;

            text = text.join("\n");

            ctx.clearRect(0, 0, el.width, el.height);
            this[el.className](el, text);

            const posX = el.style.left.slice(0, el.style.left.length - 2) * 1;
            const posY = el.style.top.slice(0, el.style.top.length - 2) * 1;
            this.setLinkers(el, posX, posY);
            this.updateCables(el);
        }

        getIfValue(el) {
            return _(this).elements.find(elem => Object.is(elem.el, el)).ifValue;
        }

        getWypisz(el) {
            return _(this).elements.find(elem => Object.is(elem.el, el)).wypisz;
        }


        changeTheme() {
            if(_(this).colors.fore == "#000") {
                _(this).colors = {
                    fore: "#fff",
                    back: "#222",
                    text: "yellow"
                };
            } else {
                _(this).colors = {
                    fore: "#000",
                    back: "#fff",
                    text: "blue"
                };
            }

            for(let el of _(this).elements) {
                this[el.el.className](el.el, el.text);
            }

            for(let el of document.getElementsByClassName("wrapper")[0].children) {
                this[el.id](el);
            }

            this.cursor(document.getElementById("cursor"));
            this.arrow(document.getElementById("cable"));
            this.eraser(document.getElementById("eraser"));
        }

        calcLineFunc(p1, p2) {
            if(p1.x != p2.x) {
                const a = (p2.y - p1.y) / (p2.x - p1.x);
                const b = p1.y - a * p1.x;
                return [a, b];
            }

            const a = 444;
            const b = p1.y - p1.x * a;
            return [a, b];
        }

        calcDistFromPointToLine(A, C, p) {
            const B = -1;
            return Math.abs(A * p.x + B * p.y + C) / Math.sqrt(A ** 2 + B ** 2);
        }

        draw(ctx, fill = true) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = _(this).colors.fore;
            ctx.stroke();
            ctx.fillStyle = _(this).colors.back;
            if(fill) ctx.fill();
        }

        write(text, canvas, size = 30) {
            const ctx = canvas.getContext("2d");
            const lines = text.split('\n');
        
            ctx.fillStyle = _(this).colors.fore;
            ctx.font = `${size}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            for(var i = 1; i <= lines.length; i++) {
                if(lines[i - 1] == "{" || lines[i - 1] == "}") ctx.textAlign = "start";

                ctx.fillText(lines[i - 1], ctx.textAlign == "center" ? canvas.width / 2 : (canvas.className == "wypiszWpisz" ? 30 : 15), canvas.height / (1 + lines.length) * i);
                ctx.textAlign = "center";
            }
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
            ctx.strokeStyle = _(this).colors.fore;
            ctx.fillStyle = _(this).colors.back;
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

        setUsed(linker1, linker2, value = true) {
            for(let item of _(this).elements)
                for(let i = 0; i < 4; i++)
                    if(Object.is(item.linkers[i], linker1) || Object.is(item.linkers[i], linker2))
                        item.linkers[i].used = value;
        }

        usedLinkers(el) {
            for(let elem of _(this).elements)
                if(Object.is(elem.el, el))
                    return elem.linkers.some(item => item.used);
        }

        getLinker(canvas, linkers) {
            for(let elem of _(this).elements)
                if(Object.is(elem.el, canvas))
                    for(let linker of elem.linkers)
                        if(Object.is(linker, linkers[0]) || Object.is(linker, linkers[1]))
                            return linker;
        }

        createCable(linker1, linker2, from, to, cables) {
            const [top1, right1, bottom1, left1] = _(this).elements.find(elem => Object.is(elem.el, from)).linkers;
            const [top2, right2, bottom2, left2] = _(this).elements.find(elem => Object.is(elem.el, to)).linkers;

            //lewy górny róg
            if(left1.x >= right2.x && top1.y >= bottom2.y) {
                if(linker1 == right1 || linker1 == bottom1) {
                    if(!left1.used) linker1 = left1;
                    else if(!top1.used) linker1 = top1;
                }
                if(linker2 == top2 || linker2 == left2) {
                    if(!right2.used) linker2 = right2;
                    else if(!bottom2.used) linker2 = bottom2;
                }
            }
            //prawy górny róg
            else if(right1.x <= left2.x && top1.y >= bottom2.y) {
                if(linker1 == left1 || linker1 == bottom1) {
                    if(!right1.used) linker1 = right1;
                    else if(!top1.used) linker1 = top1;
                }
                if(linker2 == top2 || linker2 == right2) {
                    if(!left2.used) linker2 = left2;
                    else if(!bottom2.used) linker2 = bottom2;
                }
            }
            //prawy dolny róg
            else if(right1.x <= left2.x && bottom1.y <= top2.y) {
                if(linker1 == left1 || linker1 == top1) {
                    if(!right1.used) linker1 = right1;
                    else if(!bottom1.used) linker1 = bottom1;
                }
                if(linker2 == bottom2 || linker2 == right2) {
                    if(!left2.used) linker2 = left2;
                    else if(!top2.used) linker2 = top2;
                }
            }
            //lewy dolny róg
            else if(left1.x >= right2.x && bottom1.y <= top2.y) {
                if(linker1 == right1 || linker1 == top1) {
                    if(!left1.used) linker1 = left1;
                    else if(!bottom1.used) linker1 = bottom1;
                }
                if(linker2 == bottom2 || linker2 == left2) {
                    if(!right2.used) linker2 = right2;
                    else if(!top2.used) linker2 = top2;
                }
            }
            //góra
            else if(top1.y >= bottom2.y) {
                if(linker1 != top1 && !top1.used) linker1 = top1;
                if(linker2 != bottom2 && !bottom2.used) linker2 = bottom2;
            }
            //prawo
            else if(right1.x <= left2.x) {
                if(linker1 != right1 && !right1.used) linker1 = right1;
                if(linker2 != left2 && !left2.used) linker2 = left2;
            }
            //dół
            else if(bottom1.y <= top2.y) {
                if(linker1 != bottom1 && !bottom1.used) linker1 = bottom1;
                if(linker2 != top2 && !top2.used) linker2 = top2;
            }
            //lewo
            else if(left1.x >= right2.x) {
                if(linker1 != left1 && !left1.used) linker1 = left1;
                if(linker2 != right2 && !right2.used) linker2 = right2;
            }

            cables[0] = {x: linker1.x, y: linker1.y};

            if(linker1.up && linker2.up) {
                //góra/dół do góra/dół
                cables[1] = {x: cables[0].x, y: cables[0].y + (linker2.y - cables[0].y)/2};
                cables[2] = {x: linker2.x, y: cables[1].y};
            } else if(!linker1.up && !linker2.up) {
                //lewo/prawo do lewo/prawo
                //lewo do lewo
                //prawo do prawo
                //lewo do prawo lub prawo do lewo
                if(linker1.up2 && linker2.up2) cables[1] = {x: cables[0].x - Math.abs(linker1.x - linker2.x + 20), y: cables[0].y};
                else if(!linker1.up2 && !linker2.up2) cables[1] = {x: cables[0].x + Math.abs(linker1.x - linker2.x) + 20, y: cables[0].y};
                else cables[1] = {x: cables[0].x + (linker2.x - cables[0].x)/2, y: cables[0].y};
                cables[2] = {x: cables[1].x, y: linker2.y};
            } else if(linker1.up) {
                //góra/dół do lewo/prawo
                cables[1] = {x: cables[0].x, y: linker2.y};
            } else {
                //lewo/prawo do góra/dół
                cables[1] = {x: linker2.x, y: cables[0].y};
            }
    
            cables.push({x: linker2.x, y: linker2.y});
    
            const arrow = [];
    
            if(linker2.up && linker2.up2) {
                arrow.push({x: linker2.x - 6, y: linker2.y - 6});
                arrow.push({x: linker2.x + 6, y: linker2.y - 6});
            } else if(!linker2.up && !linker2.up2) {
                arrow.push({x: linker2.x + 6, y: linker2.y - 6});
                arrow.push({x: linker2.x + 6, y: linker2.y + 6});
            } else if(linker2.up && !linker2.up2) {
                arrow.push({x: linker2.x - 6, y: linker2.y + 6});
                arrow.push({x: linker2.x + 6, y: linker2.y + 6});
            } else {
                arrow.push({x: linker2.x - 6, y: linker2.y - 6});
                arrow.push({x: linker2.x - 6, y: linker2.y + 6});
            }

            return [cables, arrow, linker1, linker2];
        }

        getCables(el) {
            let cables = [];
            for(let cable of _(this).cables)
                if(Object.is(cable.from, el) || Object.is(cable.to, el))
                    cables.push(cable);

            return cables;
        }

        getCableByDist(x, y) {
            let last;
            for(let cableSet of _(this).cables)
                for(let cable of cableSet.cable) {
                    if(cableSet.cable.indexOf(cable) == 0) {
                        last = cable;
                        continue;
                    }

                    const [a, b] = this.calcLineFunc(last, cable);

                    if((((last.x < x && cable.x > x) || (last.x > x && cable.x < x)) && last.y == cable.y) ||
                    (((last.y < y && cable.y > y) || (last.y > y && cable.y < y))) && last.x == cable.x)
                        if(this.calcDistFromPointToLine(a, b, {x, y}) <= 10) {
                            _(this).elements.find(item => Object.is(item.el, cableSet.from)).linkers.find(item => Object.is(item, cableSet.linkers[0])).used = false;
                            _(this).elements.find(item => Object.is(item.el, cableSet.to)).linkers.find(item => Object.is(item, cableSet.linkers[1])).used = false;
                            _(this).cables.splice(_(this).cables.indexOf(cableSet), 1);
                            return;
                        }
                    last = cable;
                }
        }

        updateCables(el) {
            if(!this.usedLinkers(el)) return;

            const connections = this.getCables(el);

            for(let connection of connections) {

                const {linkers, from, to} = connection;
                let linker1 = this.getLinker(from, linkers);
                let linker2 = this.getLinker(to, linkers);
                let cables = [{x: linker1.x, y: linker1.y}];
                let copy = [linker1, linker2];

                let arrow;
                [cables, arrow, linker1, linker2] = this.createCable(linker1, linker2, from, to, cables);

                if(copy[0] != linker1 || copy[1] != linker2) {
                    this.setUsed(copy[0], copy[1], false);
                    this.setUsed(linker1, linker2, true);
                }

                this.updateCable(from, to, cables, arrow, linker1, linker2);
            }
        }

        updateCable(from, to, newCable, arrow, linker1, linker2) {
            for(let cable of _(this).cables)
                if(Object.is(cable.from, from) && Object.is(cable.to, to)) {
                    cable.cable = newCable;
                    cable.linkers = [linker1, linker2];
                    cable.arrow = arrow;
                    return;
                }
        }

        validateCable(from, to, linker1, linker2) {
            let ifConnections = 0;
            
            if(from.className == "stop") return false;
            if(to.className == "start") return false;

            for(let cable of _(this).cables) {
                if(Object.is(cable.from, from) && from.className == "if")
                    ifConnections++;
                if((Object.is(cable.from, from) && from.className != "if") ||
                (ifConnections == 2) ||
                (linker1.used || linker2.used))
                    return false;
            }
            return true;
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

        set needsCheck(bool) {
            _(this).changed = bool;
        }

        crossCheck(last, cable, cableSet, ctx) {
            if(_(this).changed && last.y == cable.y) {
                const crosses = [];

                for(let cableSet2 of _(this).cables) {
                    if(Object.is(cableSet2, cableSet)) continue;

                    let last2 = null;

                    for(let cable2 of cableSet2.cable) {
                        if(last2 == null) {
                            last2 = cable2;
                            continue;
                        }

                        if(last2.x == cable2.x &&
                            (Math.min(last2.y, cable2.y) < cable.y && Math.max(last2.y, cable2.y) > cable.y) &&
                            (Math.min(last.x, cable.x) < cable2.x && Math.max(last.x, cable.x) > cable2.x))
                            {
                                crosses.push({cable, cable2});
                                break;
                        }
                        
                        last2 = cable2;
                    }
                }

                crosses.sort((a, b) => (cable.x - last.x > 0 ? a.cable2.x - b.cable2.x : b.cable2.x - a.cable2.x));
                cableSet.crosses = crosses;
            }
            
            for(let cross of cableSet.crosses) {
                if(cross.cable != cable) continue;

                const dist = Math.sign(cable.x - cross.cable2.x);

                ctx.lineTo(cross.cable2.x - 8 * dist, cable.y);
                ctx.bezierCurveTo(cross.cable2.x - 8 * dist, cable.y - 8,
                                  cross.cable2.x + 8 * dist, cable.y - 8,
                                  cross.cable2.x + 8 * dist, cable.y);
            }

            ctx.lineTo(cable.x, cable.y);
        }

        showCables() {
            const canvas = document.getElementById("cables");
            const ctx = canvas.getContext("2d");

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for(let cables of _(this).cables) {
                ctx.beginPath();
                ctx.moveTo(cables.cable[0].x, cables.cable[0].y);

                for(let i = 1; i < cables.cable.length; i++) {
                    this.crossCheck(cables.cable[i - 1], cables.cable[i], cables, ctx);
                }
                
                ctx.lineTo(cables.arrow[0].x, cables.arrow[0].y);
                ctx.moveTo(cables.cable[cables.cable.length-1].x, cables.cable[cables.cable.length-1].y);
                ctx.lineTo(cables.arrow[1].x, cables.arrow[1].y);
                
                this.draw(ctx, false);
            }

            for(let elem of _(this).elements) {
                if(elem.el.className == "if" && elem.el.dataset.linked == "false") {
                    for(let value of ["TRUE", "FALSE"]) {
                        ctx.font = "13px Arial";
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillStyle = _(this).colors.text;

                        if(elem.ifValue[value.toLowerCase()] == "Góra") ctx.fillText(value, elem.linkers[0].x - 24, elem.linkers[0].y - 12);
                        if(elem.ifValue[value.toLowerCase()] == "Prawo") ctx.fillText(value, elem.linkers[1].x + 16, elem.linkers[1].y - 12);
                        if(elem.ifValue[value.toLowerCase()] == "Lewo") ctx.fillText(value, elem.linkers[3].x - 16, elem.linkers[3].y - 12);
                        if(elem.ifValue[value.toLowerCase()] == "Dół") ctx.fillText(value, elem.linkers[2].x - 24, elem.linkers[2].y + 12);
                    }
                } else if(elem.el.className == "wypiszWpisz" && elem.el.dataset.linked == "false") {
                    ctx.font = "12px Arial";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = _(this).colors.text;
                    ctx.fillText((elem.wypisz ? "WYPISZ" : "WPISZ"), elem.linkers[0].x - 30, elem.linkers[0].y - 12);
                }
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

        cursor(canvas) {
            const ctx = canvas.getContext("2d");

            ctx.beginPath();
            ctx.moveTo(canvas.width/2 - 10, canvas.height/2 - 17);
            ctx.lineTo(canvas.width/2 + 10, canvas.height/2 + 4);
            ctx.lineTo(canvas.width/2 + 2, canvas.height/2 + 5);
            ctx.lineTo(canvas.width/2 + 8, canvas.height/2 + 16);
            ctx.lineTo(canvas.width/2 + 2, canvas.height/2 + 17);
            ctx.lineTo(canvas.width/2 - 3, canvas.height/2 + 7);
            ctx.lineTo(canvas.width/2 - 10, canvas.height/2 + 12);
            ctx.lineTo(canvas.width/2 - 10, canvas.height/2 - 17);

            this.draw(ctx, false);
        }

        eraser(canvas) {
            const ctx = canvas.getContext("2d");

            ctx.beginPath();
            ctx.moveTo(canvas.width/2 - 17, canvas.height/2 - 17);
            ctx.lineTo(canvas.width/2 + 17, canvas.height/2 + 17);
            this.draw(ctx);

            ctx.moveTo(canvas.width/2 + 17, canvas.height/2 - 17);
            ctx.lineTo(canvas.width/2 - 17, canvas.height/2 + 17);
            this.draw(ctx);
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

        poleObliczeniowe(canvas, text = null) {
            if(text == null) this.setSize(canvas);
            this.rect(canvas);
            this.write(text != null ? text : "Pole Obliczeniowe", canvas, 15);
        }

        wypiszWpisz(canvas, text = null) {
            if(text == null) this.setSize(canvas);
            this.parallelogram(canvas);
            this.write(text != null ? text : "Wypisz/Wpisz", canvas, 15);
        }

        if(canvas, text = null) {
            if(text == null) this.setSize(canvas);
            this.rhombus(canvas);
            this.write(text != null ? text : "If", canvas, text != null ? 20 : 30);
        }
    }

    return Engine;

})();