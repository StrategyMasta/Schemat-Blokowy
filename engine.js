const engine = (function() {
    let priv = new WeakMap();
    let _ = instance => priv.get(instance);

    class Engine {
        constructor() {
            var privateMembers = {
                elements: [],
                size: 1,
                cables: [],
                speed: 1,
                changed: false,
                colors: {
                    fore: "#fff",
                    back: "#222",
                    text: "yellow"
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
                crosses: [],
                cableConnections: new WeakMap()
            });
        }

        removeCables(el) {
            let cables = [];

            for(let cable of _(this).cables) {
                if(Object.is(cable.from, el) && cable.el3) {
                    _(this).cables.find(cableSet => Object.is(cableSet, cable.el3)).cableConnections.delete(cable.linkers[0]);
                    cables.push(cable);
                }
                else if(Object.is(cable.from, el)) {
                    _(this).elements.find(item => Object.is(item.el, cable.to)).linkers.find(item => Object.is(item, cable.linkers[1])).used = false;
                    cables.push(cable);
                } else if(Object.is(cable.to, el)) {
                    _(this).elements.find(item => Object.is(item.el, cable.from)).linkers.find(item => Object.is(item, cable.linkers[0])).used = false;
                    cables.push(cable);
                }
            }

            for(let cable of cables)
                this.deleteCableConnections(cable);
                
            
            for(let cable of cables)
                _(this).cables.splice(_(this).cables.indexOf(cable), 1);
            
            // this.needsCheck = true;
            this.showCables();
            setTimeout(() => { this.showCables(); }, 50);
        }

        removeElement(el) {
            _(this).elements.splice(_(this).elements.indexOf(_(this).elements.find(item => Object.is(item.el, el))), 1);
        }

        set size(s) {
            _(this).size = s;
        }

        getSpeed() {
            return _(this).speed;
        }

        doubleTheSpeed() {
            _(this).speed *= 2;
        }

        resetSpeed() {
            _(this).speed = 1;
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

            if(options.ifValue) {
                this.fixIfConnections(originalEl, originalEl.ifValue, options.ifValue);
                originalEl.ifValue = options.ifValue;
            } else if(options.wypisz != null)
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
            this.showCables();
        }

        fixIfConnections(elem, oldIfValues, newIfValues) {
            // Kolejność: Góra, Prawo, Dół, Lewo
            const side = ["Góra", "Prawo", "Dół", "Lewo"];
            const cables = _(this).cables.filter(cable => Object.is(cable.from, elem.el) || Object.is(cable.to, elem.el));
            const data = [];

            for(let linker of elem.linkers) {
                const cableData = {};
                linker.used = false;

                for(let cable of cables) {
                    if(!cable.linkers.includes(linker)) continue;

                    cableData.ifValue = oldIfValues.true == side[elem.linkers.indexOf(linker)] ? "true" : (oldIfValues.false == side[elem.linkers.indexOf(linker)] ? "false" : "none");
                    cableData.cable = cable;
                    // TODO: Save The WeakMap Value
                }

                if(cableData.ifValue != null) data.push(cableData);
            }
            
            for(let i = 0; i < data.length; i++) {
                if(data[i].ifValue == "none") {
                    const availableSide = side.filter(thisSide => !Object.values(newIfValues).includes(thisSide))[0];
                    elem.linkers[side.indexOf(availableSide)].used = true;
                    // TODO: WeakMap
                    data[i].cable.linkers[1] = elem.linkers[side.indexOf(availableSide)];
                } else if(data[i].ifValue == "true") {
                    const availableSide = side.find(thisSide => thisSide == newIfValues.true);
                    elem.linkers[side.indexOf(availableSide)].used = true;
                    if(data[i].cable.el3 && !Object.is(data[i].cable.linkers[0], elem.linkers[side.indexOf(availableSide)])) {
                        data[i].cable.el3.cableConnections.set(elem.linkers[side.indexOf(availableSide)], data[i].cable.el3.cableConnections.get(data[i].cable.linkers[0]));
                        data[i].cable.el3.cableConnections.delete(data[i].cable.linkers[0]);
                    }
                    // TODO: WeakMap
                    data[i].cable.linkers[0] = elem.linkers[side.indexOf(availableSide)];
                } else {
                    const availableSide = side.find(thisSide => thisSide == newIfValues.false);
                    elem.linkers[side.indexOf(availableSide)].used = true;
                    if(data[i].cable.el3 && !Object.is(data[i].cable.linkers[0], elem.linkers[side.indexOf(availableSide)])) {
                        data[i].cable.el3.cableConnections.set(elem.linkers[side.indexOf(availableSide)], data[i].cable.el3.cableConnections.get(data[i].cable.linkers[0]));
                        data[i].cable.el3.cableConnections.delete(data[i].cable.linkers[0]);
                    }
                    // TODO: WeakMap
                    data[i].cable.linkers[0] = elem.linkers[side.indexOf(availableSide)];
                }
            }

            this.updateCables(elem.el);
            this.showCables();

            setTimeout(() => {this.updateCables(elem.el); this.showCables();}, 50);
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

            this.showCables();

            // this.cursor(document.getElementById("cursor"));
            // this.arrow(document.getElementById("cable"));
            // this.eraser(document.getElementById("eraser"));
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

        draw(ctx, fill = true, color = null) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = color || _(this).colors.fore;
            ctx.stroke();
            ctx.fillStyle = color || _(this).colors.back;
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

        setUsed(linker1, linker2 = null, value = true) {
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

            const fromIfValue = _(this).elements.find(elem => Object.is(elem.el, from)).ifValue;
            const toIfValue = _(this).elements.find(elem => Object.is(elem.el, to)).ifValue;

            const validateConn = (isLinker1, side) => {
                if((isLinker1 && from.className != "if") || (!isLinker1 && to.className != "if")) return true;

                if(isLinker1 && (fromIfValue.false != side || fromIfValue.true != side)) return false;
                if(!isLinker1 && (toIfValue.false == side || toIfValue.true == side)) return false;

                return true;
            }

            //lewy górny róg
            if(left1.x >= right2.x && top1.y >= bottom2.y) {
                if(linker1 == right1 || linker1 == bottom1) {
                    if(!left1.used && validateConn(true, "Lewo")) linker1 = left1;
                    else if(!top1.used && validateConn(true, "Góra")) linker1 = top1;
                }
                if(linker2 == top2 || linker2 == left2) {
                    if(!right2.used && validateConn(false, "Prawo")) linker2 = right2;
                    else if(!bottom2.used && validateConn(false, "Dół")) linker2 = bottom2;
                }
            }
            //prawy górny róg
            else if(right1.x <= left2.x && top1.y >= bottom2.y) {
                if(linker1 == left1 || linker1 == bottom1) {
                    if(!right1.used && validateConn(true, "Prawo")) linker1 = right1;
                    else if(!top1.used && validateConn(true, "Góra")) linker1 = top1;
                }
                if(linker2 == top2 || linker2 == right2) {
                    if(!left2.used && validateConn(false, "Lewo")) linker2 = left2;
                    else if(!bottom2.used && validateConn(false, "Dół")) linker2 = bottom2;
                }
            }
            //prawy dolny róg
            else if(right1.x <= left2.x && bottom1.y <= top2.y) {
                if(linker1 == left1 || linker1 == top1) {
                    if(!right1.used && validateConn(true, "Prawo")) linker1 = right1;
                    else if(!bottom1.used && validateConn(true, "Dół")) linker1 = bottom1;
                }
                if(linker2 == bottom2 || linker2 == right2) {
                    if(!left2.used && validateConn(false, "Lewo")) linker2 = left2;
                    else if(!top2.used && validateConn(false, "Góra")) linker2 = top2;
                }
            }
            //lewy dolny róg
            else if(left1.x >= right2.x && bottom1.y <= top2.y) {
                if(linker1 == right1 || linker1 == top1) {
                    if(!left1.used && validateConn(true, "Lewo")) linker1 = left1;
                    else if(!bottom1.used && validateConn(true, "Dół")) linker1 = bottom1;
                }
                if(linker2 == bottom2 || linker2 == left2) {
                    if(!right2.used && validateConn(false, "Prawo")) linker2 = right2;
                    else if(!top2.used && validateConn(false, "Góra")) linker2 = top2;
                }
            }
            //góra
            else if(top1.y >= bottom2.y) {
                if(linker1 != top1 && !top1.used && validateConn(true, "Góra")) linker1 = top1;
                if(linker2 != bottom2 && !bottom2.used && validateConn(false, "Dół")) linker2 = bottom2;
            }
            //prawo
            else if(right1.x <= left2.x) {
                if(linker1 != right1 && !right1.used && validateConn(true, "Prawo")) linker1 = right1;
                if(linker2 != left2 && !left2.used && validateConn(false, "Lewo")) linker2 = left2;
            }
            //dół
            else if(bottom1.y <= top2.y) {
                if(linker1 != bottom1 && !bottom1.used && validateConn(true, "Dół")) linker1 = bottom1;
                if(linker2 != top2 && !top2.used && validateConn(false, "Góra")) linker2 = top2;
            }
            //lewo
            else if(left1.x >= right2.x) {
                if(linker1 != left1 && !left1.used && validateConn(true, "Lewo")) linker1 = left1;
                if(linker2 != right2 && !right2.used && validateConn(false, "Prawo")) linker2 = right2;
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
                if(Object.is(cable.from, el) || Object.is(cable.to, el) || cables.some(thisCable => Object.is(cable.el3, thisCable)))
                    cables.push(cable);

            return cables;
        }

        getCableByDist(x, y, action) {
            let last;
            for(let cableSet of _(this).cables)
                for(let cable of cableSet.cable) {
                    if(cableSet.cable.indexOf(cable) == 0) {
                        last = cable;
                        continue;
                    }

                    const [a, b] = this.calcLineFunc(last, cable);

                    if((((last.x < x && cable.x > x) || (last.x > x && cable.x < x)) && last.y == cable.y) ||
                    (((last.y < y && cable.y > y) || (last.y > y && cable.y < y)) && last.x == cable.x))
                        if(this.calcDistFromPointToLine(a, b, {x, y}) <= 10) {
                            if(action == "delete") {
                                _(this).elements.find(item => Object.is(item.el, cableSet.from)).linkers.find(item => Object.is(item, cableSet.linkers[0])).used = false;
                                if(!cableSet.el3) _(this).elements.find(item => Object.is(item.el, cableSet.to)).linkers.find(item => Object.is(item, cableSet.linkers[1])).used = false;
                                else _(this).cables.find(cableSet2 => Object.is(cableSet2, cableSet.el3)).cableConnections.delete(cableSet.linkers[0]);
                                
                                this.deleteCableConnections(cableSet);
                                
                                _(this).cables.splice(_(this).cables.indexOf(cableSet), 1);
                                this.showCables();
                                return true;
                            }

                            const connDist = Math.sqrt(((x - last.x) ** 2 + (y - last.y) ** 2) - (this.calcDistFromPointToLine(a, b, {x, y}) ** 2));
                            const cableDist = Math.sqrt((cable.x - last.x) ** 2 + (cable.y - last.y) ** 2);
                            const cableIndex = cableSet.cable.indexOf(last);

                            return [connDist / cableDist, cableSet.from, cableSet, cableIndex];
                        }
                    last = cable;
                }
            
            return false;
        }

        deleteCableConnections(cableSet, isFirst = true) {
            const cables = [];

            for(let cableSet2 of _(this).cables)
                if(Object.is(cableSet2.el3, cableSet))
                    cables.push(cableSet2);
                
            if(cables == 0x0 && !isFirst) {
                _(this).elements.find(item => Object.is(item.el, cableSet.from)).linkers.find(item => Object.is(item, cableSet.linkers[0])).used = false;
                _(this).cables.splice(_(this).cables.indexOf(cableSet), 1);
                return;
            }
            
            for(let cable of cables)
                this.deleteCableConnections(cable, false);
            
            if(!isFirst) {
                _(this).elements.find(item => Object.is(item.el, cableSet.from)).linkers.find(item => Object.is(item, cableSet.linkers[0])).used = false;
                _(this).cables.splice(_(this).cables.indexOf(cableSet), 1);
            }
        }

        checkCableConnect(el1, linker1, x, y) {
            if(this.getCableByDist(x, y, "connectCable") && this.validateCable(el1, {}, linker1, {})) {
                this.createCableConnect(el1, linker1, x, y);
                return true;
            }

            return false;
        }

        createCableConnect(el1, linker1, x, y) {
            const [ratio, el2, cableSet, cableIndex] = this.getCableByDist(x, y, "connectCable");

            cableSet.cableConnections.set(linker1, {cableIndex});

            const [cables, arrow, linker1New, linker2] = this.cableConnect(el1, linker1, cableSet, ratio);

            this.addCable(cables, el1, el2, arrow, [linker1New, linker2]);
            this.setUsed(linker1New);

            _(this).cables[_(this).cables.length - 1].ratio = ratio;
            _(this).cables[_(this).cables.length - 1].el3 = cableSet;

            this.showCables();
        }

        cableConnect(el1, linker1, cableSet, ratio) {
            if(cableSet.cableConnections.get(linker1).cableIndex == cableSet.cable.length) {
                const weakmap = cableSet.cableConnection.get(linker1);
                weakmap.cableIndex--;

                cableSet.cableConnection.set(linker1, weakmap);
                // _(this).cables.find(cable => Object.is(cable, cableSet)).cableConnections.set(linker1, {cableIndex: 1});
            }

            const last = cableSet.cable[cableSet.cableConnections.get(linker1).cableIndex];
            const cable = cableSet.cable[cableSet.cableConnections.get(linker1).cableIndex + 1];
            // FIXME: cable powyżej robi się undefined, powodem może być zły cableIndex czy coś
            const linker2 = {x: (last.x + ratio * (cable.x - last.x)), y: (last.y + ratio * (cable.y - last.y))};
            const [top, right, bottom, left] = _(this).elements.find(elem => Object.is(elem.el, el1)).linkers;
            
            linker2.up = last.y == cable.y;
            linker2.up2 = (linker2.up && linker1.y < linker2.y) || (!linker2.up && linker1.x < linker2.x);

            if(linker2.up) linker2.y += linker2.up2 ? -5 : 5;
            else linker2.x += linker2.up2 ? -5 : 5;

            const copy = linker1;

            // const fromIfValue = _(this).elements.find(elem => Object.is(elem.el, el1)).ifValue;

            const validateConn = () => {
                return el1.className != "if";

                // if((fromIfValue.false != side || fromIfValue.true != side)) return false;

                // return true;
            }


            if(top.y > linker2.y && linker1 == top) {}
            else if(right.x < linker2.x && linker1 == right) {}
            else if(bottom.y < linker2.y && linker1 == bottom) {}
            else if(left.x > linker2.x && linker1 == left) {}

            else if(top.y > linker2.y && !top.used && validateConn()) linker1 = top;
            else if(right.x < linker2.x && !right.used && validateConn()) linker1 = right;
            else if(bottom.y < linker2.y && !bottom.used && validateConn()) linker1 = bottom;
            else if(left.x > linker2.x && !left.used && validateConn()) linker1 = left;

            if(!Object.is(linker1, copy)) {
                cableSet.cableConnections.set(linker1, cableSet.cableConnections.get(copy));
                cableSet.cableConnections.delete(copy);

                this.setUsed(copy, null, false);
                this.setUsed(linker1, null, true);
            }

            //cable
            let cables = [{x: linker1.x, y: linker1.y}];

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

            //arrow
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

        updateCables(el) {
            if(!this.usedLinkers(el)) return;

            const connections = this.getCables(el);

            connections.sort((a, b) => (a.el3 ? -1 : 1));

            for(let connection of connections) {

                if(connection.el3) {
                    const {linkers, from, to, el3, ratio} = connection;
                    const linker1 = this.getLinker(from, linkers);

                    const [cables, arrow, linker1New, linker2] = this.cableConnect(from, linker1, el3, ratio);

                    this.updateCable(cables, arrow, linker1New, linker2, connection);

                    continue;
                }

                const {linkers, from, to} = connection;
                let linker1 = this.getLinker(from, linkers);
                let linker2 = this.getLinker(to, linkers);
                let cables = [{x: linker1.x, y: linker1.y}];
                let copy = [linker1, linker2];
                // FIXME: Na Linijce 687 Dało Błąd Mówiący, Że linker1 To undefined
                // Oraz Połączenie Przychodzące Podłączyło Się Do True Przed Tym

                let arrow;
                [cables, arrow, linker1, linker2] = this.createCable(linker1, linker2, from, to, cables);

                if(copy[0] != linker1 || copy[1] != linker2) {
                    this.setUsed(copy[0], copy[1], false);
                    this.setUsed(linker1, linker2, true);
                }

                this.updateCable(cables, arrow, linker1, linker2, connection);
            }
        }

        updateCable(newCable, arrow, linker1, linker2, cableSet) {
            for(let cable of _(this).cables)
                if(Object.is(cable, cableSet)) {
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


            const [top1, right1, bottom1, left1] = _(this).elements.find(elem => Object.is(elem.el, from)).linkers;
            const fromIfValue = _(this).elements.find(elem => Object.is(elem.el, from)).ifValue;


            if(from.className == "if" &&
            !((fromIfValue.false == "Lewo" && Object.is(linker1, left1)) || (fromIfValue.true == "Lewo" && Object.is(linker1, left1)) || 
            (fromIfValue.false == "Prawo" && Object.is(linker1, right1)) || (fromIfValue.true == "Prawo" && Object.is(linker1, right1)) || 
            (fromIfValue.false == "Góra" && Object.is(linker1, top1)) || (fromIfValue.true == "Góra" && Object.is(linker1, top1)) || 
            (fromIfValue.false == "Dół" && Object.is(linker1, bottom1)) || (fromIfValue.true == "Dół" && Object.is(linker1, bottom1))))
                return false;

            if(to.className) {
                const [top2, right2, bottom2, left2] = _(this).elements.find(elem => Object.is(elem.el, to)).linkers;
                const toIfValue = _(this).elements.find(elem => Object.is(elem.el, to)).ifValue;


                if(to.className == "if" &&
                ((toIfValue.false == "Lewo" && Object.is(linker2, left2)) || (toIfValue.true == "Lewo" && Object.is(linker2, left2)) || 
                (toIfValue.false == "Prawo" && Object.is(linker2, right2)) || (toIfValue.true == "Prawo" && Object.is(linker2, right2)) || 
                (toIfValue.false == "Góra" && Object.is(linker2, top2)) || (toIfValue.true == "Góra" && Object.is(linker2, top2)) || 
                (toIfValue.false == "Dół" && Object.is(linker2, bottom2)) || (toIfValue.true == "Dół" && Object.is(linker2, bottom2))))
                    return false;
            }

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
            if(last.y == cable.y) {
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

        escape(e) {
            document.body.dataset.stop = e.key == "Escape";
        }

        runCode(run) {
            let cable = Object.assign({}, _(this).cables.find(cableSet => cableSet.from.className == "start"));

            let cables2 = [];

            if(!cable?.cable) {
                const canvas = document.getElementById("preview");
                const ctx = canvas.getContext("2d");

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const root = document.querySelector(":root");
                root.style.pointerEvents = "all";

                document.getElementById("try").disabled = false;
                document.getElementById("run").disabled = false;

                return;
            }

            if(!run) {
                const escape = document.getElementById("escape");

                escape.style.animationName = "";
                setTimeout(() => escape.style.animationName = "fadeOut", 50);
            }

            for(let thisCable of cable.cable)
                cables2.push({...thisCable});

            cable = Object.assign(cable, {cable: cables2});
            // const code = this.collectCode();

            // if(code == "LIMIT") {
            //     alert("Błąd: Osiągnięto limit wykonywanego kodu");
            //     return;
            // }

            const thisData = {
                cable,
                cableIndex: 0,
                index: 0,
                vars: {},
                animate: !run
            };

            document.addEventListener("keydown", this.escape);

            this.animateRun(thisData);
        }

        async animateRun(data) {
            const canvas = document.getElementById("preview");
            const ctx = canvas.getContext("2d");

            if(document.body.dataset.stop == "true") {
                document.removeEventListener("keydown", this.escape);

                document.body.dataset.stop = "false";

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const root = document.querySelector(":root");
                root.style.pointerEvents = "all";

                document.getElementById("try").disabled = false;
                document.getElementById("run").disabled = false;

                return;
            } else if(data.animate && data.cableIndex != data.cable.cable.length - 1) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                //calculate
                const signX = Math.sign(data.cable.cable[data.cableIndex + 1].x - data.cable.cable[data.cableIndex].x);
                const signY = Math.sign(data.cable.cable[data.cableIndex + 1].y - data.cable.cable[data.cableIndex].y);

                const isHorizontal = data.cable.cable[data.cableIndex].x == data.cable.cable[data.cableIndex + 1].x;

                data.cable.cable[data.cableIndex].x += isHorizontal ? 0 : signX * 1 * _(this).speed;
                data.cable.cable[data.cableIndex].y += !isHorizontal ? 0 : signY * 1 * _(this).speed;

                //draw
                ctx.beginPath();
                ctx.arc(data.cable.cable[data.cableIndex].x, data.cable.cable[data.cableIndex].y, 10, 0, Math.PI * 2);
                this.draw(ctx, true, "purple");

                let data2 = data;

                if((signX == 0 && signY == 0) || 
                    signX != Math.sign(data.cable.cable[data.cableIndex + 1].x - data.cable.cable[data.cableIndex].x) ||
                    signY != Math.sign(data.cable.cable[data.cableIndex + 1].y - data.cable.cable[data.cableIndex].y)
                ) {
                    data2 = {
                        cable: data.cable,
                        cableIndex: data.cableIndex + 1,
                        index: data.index,
                        vars: data.vars,
                        animate: true
                    }
                }

                setTimeout(() => this.animateRun(data2), 1);
                return;
            }
            else if(data.cable.to.className != "stop") {
                let [result, newCable] = data.cable.el3 ? [null, Object.assign({}, data.cable.el3)] : this.evalCode(data.cable.to);
                // let newCable = Object.assign({}, data.cableSets[data.index + 1]);
                const sides = ["Góra", "Prawo", "Dół", "Lewo"];
                let isError = false;
                // let newCable;
                
                // if(data.cable.to.className == "if")
                //     newCable = Object.assign({}, _(this).cables.find(cableSet => Object.is(cableSet.from, data.cable.to) && Object.is(data.cable.to.linkers[sides.indexOf(data.cable.to.ifValue[data.code[data.index + 1]])], cableSet.linkers[0])));
                // else
                //     newCable = Object.assign({}, _(this).cables.find(cableSet => Object.is(cableSet.from, data.cable.to)));


                if(data.index >= 1000) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    const root = document.querySelector(":root");
                    root.style.pointerEvents = "all";

                    document.getElementById("try").disabled = false;
                    document.getElementById("run").disabled = false;

                    alert("Osiągnięto limit");

                    return;
                }

                // Zmienne
                for(let var_ of Object.entries(data.vars))
                    window.eval(`var ${var_[0]} = ${var_[1]};`);

                // TODO: Dorobić obsługę pozostałych bloków oraz może dodać zabezpieczenie
                // TODO: na wypadek stworzenia zmiennej, która już jest tu zdefiniowana

                const __KEYS__ = Object.keys(this);
                
                const runAndUpdate = async () => {
                    // Run Code Here
                    // await window.eval(`(async () => { ${ result } })()`);
                    await window.eval(`${ result }`);

                    // Update The Variables
                    Object.entries(data.vars).forEach(item => data.vars[item[0]] = window.eval(item[0]));

                    // Save New Variables
                    if(__KEYS__.length != Object.keys(this).length)
                        for(let key of Object.entries(this).slice(__KEYS__.length))
                            data.vars[key[0]] = key[1];
                }

                // const checkForNewVars = () => {
                //     // Save New Variables
                //     if(__KEYS__.length != Object.keys(this).length)
                //         for(let key of Object.entries(this).slice(__KEYS__.length))
                //             data.vars[key[0]] = key[1];
                // }
                
                if(data.cable.to.className == "wypiszWpisz") {
                    const __ELEM__ = _(this).elements.find(el2 => Object.is(el2.el, data.cable.to));

                    if(__ELEM__.wypisz) {
                        try {
                            await runAndUpdate();
                            // Automatically Scroll Down 
                            document.getElementById("output").scrollTop = document.getElementById("output").scrollHeight;
                        } catch(err) {
                            alert(err);
                            isError = true;
                        }
                        //checkForNewVars();
                    } else {
                        try {
                            await runAndUpdate();
                        } catch(err) {
                            alert(err);
                            isError = true;
                        }
                        //checkForNewVars();
                    }
                }
                else if(data.cable.to.className == "poleObliczeniowe") {
                    try {
                        await runAndUpdate();
                    } catch(err) {
                        alert(err);
                        isError = true;
                    }
                    //checkForNewVars();
                }
                else if(data.cable.to.className == "if") {
                    const __ELEM__ = _(this).elements.find(el2 => Object.is(el2.el, data.cable.to));
                    const ifResult = !!window.eval(result);
                    const __SIDE__ = __ELEM__.linkers[sides.indexOf(__ELEM__.ifValue[`${ ifResult }`])];

                    // Update The Variables
                    Object.entries(data.vars).forEach(item => data.vars[item[0]] = window.eval(item[0]));

                    newCable = Object.assign({}, _(this).cables.find(cableSet => Object.is(cableSet.from, data.cable.to) && Object.is(__SIDE__, cableSet.linkers[0])));

                    if(!newCable.to && !newCable.el3) alert(`BŁĄD: Do ${ifResult} nie ma podłączonego kabla`);
                }

                // Zabezpieczenie Na Wypadek Błędu
                if(isError || newCable == undefined || (!newCable.to && !newCable.el3)) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    const root = document.querySelector(":root");
                    root.style.pointerEvents = "all";

                    document.getElementById("try").disabled = false;
                    document.getElementById("run").disabled = false;

                    return;
                }

                //let newCable = Object.assign({}, _(this).cables.find(cableSet => Object.is(cableSet.from, data.cable.to)));
                let cables3 = [];
                let cableIndex = 0;

                for(let thisCable of newCable.cable)
                    cables3.push({...thisCable});

                newCable = Object.assign(newCable, {cable: cables3});

                if(data.cable.el3) {
                    // if(linker2.up) linker2.y += linker2.up2 ? -5 : 5;
                    // else linker2.x += linker2.up2 ? -5 : 5;
                    const offset = {};
                    offset.x = data.cable.up ? 0 : (data.cable.up2 ? 5 : -5);
                    offset.y = !data.cable.up ? 0 : (data.cable.up2 ? 5 : -5);

                    newCable.cable[newCable.cableConnections.get(data.cable.linkers[0]).cableIndex].x = data.cable.linkers[1].x + offset.x;
                    newCable.cable[newCable.cableConnections.get(data.cable.linkers[0]).cableIndex].y = data.cable.linkers[1].y + offset.y;
                    cableIndex = newCable.cableConnections.get(data.cable.linkers[0]).cableIndex;
                }

                // if(newCable.cable.x)
                // TODO: isHorizontal check and fix

                //next cable
                let newData = {
                    cable: newCable,
                    cableIndex,
                    index: data.index + 1,
                    vars: data.vars,
                    animate: data.animate
                };

                setTimeout(() => this.animateRun(newData), 1);
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const root = document.querySelector(":root");
            root.style.pointerEvents = "all";

            document.getElementById("try").disabled = false;
            document.getElementById("run").disabled = false;
        }

        // Eksperymentalna Metoda
        evalCode(el) {
            const elem = _(this).elements.find(el2 => Object.is(el2.el, el));
            let result = "";

            // function run(text) {
            //     let result2;

            //     try {
            //         return result2 = eval(text);
            //     }
            //     catch(err) {
            //         alert("Błąd: " + err);

            //         return "__ERROR175__";
            //     }
            //     // return eval(text);
            // }

            if(elem.el.className == "poleObliczeniowe") {
                result = elem.text;
            } else if(elem.el.className == "wypiszWpisz") {
                if(elem.wypisz) result = `document.getElementById("output").children[2].innerHTML += ${elem.text}`;
                // else result = `elem.text + " = " + alert("Podaj: " + elem.text)`;
                // else result = elem.text.split(",").map(item => `var ${ item.trim() } = window.eval("(() => {return " + prompt('Podaj ${ item.trim() }:') + "})()")`).join(";");
                else result = `var ${ elem.text.trim() } = window.eval("(() => {return " + prompt('Podaj ${ elem.text.trim() }:') + "})()")`;
            } else if(elem.el.className == "if") {
                // result = run(elem.text);
                // let side;

                // if(result == "__ERROR175__") return [undefined, undefined];

                // //[top, right, bottom, left]
                // if(elem.ifValue[`${!!result}`] == "Góra") side = elem.linkers[0];
                // else if(elem.ifValue[`${!!result}`] == "Prawo") side = elem.linkers[1];
                // else if(elem.ifValue[`${!!result}`] == "Dół") side = elem.linkers[2];
                // else if(elem.ifValue[`${!!result}`] == "Lewo") side = elem.linkers[3];
                
                // // Make A Catch Statement Here In Case The False Or True Connection Doesn't Exist

                // return [`${!!result}`, Object.assign({}, _(this).cables.find(cableSet => Object.is(cableSet.from, elem.el) && Object.is(side, cableSet.linkers[0])))];
                return [elem.text, undefined];
            }

            return [result, Object.assign({}, _(this).cables.find(cableSet => Object.is(cableSet.from, elem.el)))];
        }

        // collectCode() {
        //     let nextCable = Object.assign({}, _(this).cables.find(cableSet => cableSet.from.className == "start"));
        //     const code = [];
        //     const LIMIT = 1000;

        //     while(code.length <= LIMIT) {
        //         const [result, cableSet] = nextCable.el3 ? [null, Object.assign({}, nextCable.el3)] : this.evalCode(nextCable.to);

        //         if(cableSet == undefined || (!cableSet.to && !cableSet.el3)) break;

        //         nextEl = el;
        //         code.push(result);
        //     }

        //     if(code.length > LIMIT)
        //         return "LIMIT";

        //     return code;
        // }

        export(save) {
            const exportData = {
                elements: [],
                cables: [],
                linkers: [],
                blocks: [],
                cableConnections: []
            };

            for(let element of _(this).elements) {
                if(element.el.dataset.linked == "true") continue;

                exportData.blocks.push(element.el);
                exportData.elements.push({
                    el: element.el.className,
                    text: element.text,
                    ifValue: element.ifValue,
                    wypisz: element.wypisz,
                    linkers: element.linkers,
                    left: element.el.style.left,
                    top: element.el.style.top
                });

                for(let linker of element.linkers)
                    exportData.linkers.push(linker);
            }

            for(let cableSet of _(this).cables) {
                if(cableSet.el3) {
                    exportData.cableConnections.push({
                        linker: exportData.linkers.indexOf(cableSet.linkers[0]),
                        el3: cableSet.el3
                    });
                }
            }

            for(let cableSet of _(this).cables) {
                const from = exportData.blocks.indexOf(cableSet.from);
                const to = exportData.blocks.indexOf(cableSet.to);
                const linker1 = exportData.linkers.indexOf(cableSet.linkers[0]);
                const linker2 = cableSet.el3 ? cableSet.linkers[1] : exportData.linkers.indexOf(cableSet.linkers[1]);
                const connectedCable = exportData.cableConnections.find(cable => Object.is(cable.el3, cableSet));
                const cableConnections = !connectedCable ? null : {
                    linker: connectedCable.linker,
                    index: cableSet.cableConnections.get(exportData.linkers[connectedCable.linker]).cableIndex
                };
                const el3 = cableSet.el3 ? _(this).cables.indexOf(cableSet.el3) : undefined;

                exportData.cables.push({
                    cable: cableSet.cable,
                    from,
                    to,
                    arrow: cableSet.arrow,
                    linkers: [linker1, linker2],
                    crosses: cableSet.crosses,
                    cableConnections,
                    ratio: cableSet.ratio,
                    el3
                });
            }


            exportData.blocks = undefined;
            exportData.linkers = undefined;
            exportData.cableConnections = undefined;

            // Zapisywanie Danych

            // Zapisanie Do LocalStorage
            localStorage.setItem(`export${save}`, JSON.stringify(exportData));
        }

        import(createBlock, deleteBlock, save) {
            // Usuwanie Wszystkiego Co Już Jest Na Ekranie
            for(let i = 0; i < _(this).elements.length; i++)
                if(_(this).elements[i].el.dataset.linked == "false") {
                    deleteBlock(_(this).elements[i].el, this);
                    i--;
                }

            // Pobieranie Danych
            const importData = JSON.parse(localStorage.getItem(`export${save}`));
            const blocks = [];
            const linkers = [];

            if(!importData) return;

            for(let element of importData.elements) {
                createBlock(element.el, this);

                const elem = _(this).elements[_(this).elements.length - 1];
                const posX = element.left.slice(0, element.left.length - 2) * 1;
                const posY = element.top.slice(0, element.top.length - 2) * 1;
                elem.el.style.opacity = 1;
                elem.el.style.zIndex = -1;
                elem.el.style.cursor = null;
                elem.el.dataset.linked = false;
                elem.el.dataset.linked2 = false;
                this.setLinkers(elem.el, posX, posY);
                this[elem.el.className](elem.el);
                this.linker(elem.el);

                elem.text = element.text;
                elem.ifValue = element.ifValue;
                elem.wypisz = element.wypisz;
                elem.linkers = element.linkers;
                elem.el.style.left = element.left;
                elem.el.style.top = element.top;

                if(elem.el.className == "if")
                    elem.el.getContext("2d").font = "20px Arial";
                if(elem.text || elem.el.className == "if")
                    this.setText(elem.el, elem.text, {});
                // elem.ifValue.false != "Lewo" || elem.ifValue.true != "Prawo" ? { ifValue: elem.ifValue } : {}

                blocks.push(elem.el);
                linkers.push(...element.linkers);
            }


            for(let cableSet of importData.cables) {
                // Create Cable
                this.addCable(cableSet.cable, blocks[cableSet.from], blocks[cableSet.to], cableSet.arrow, [linkers[cableSet.linkers[0]], (cableSet.el3 != null ? cableSet.linkers[1] : linkers[cableSet.linkers[1]])]);
                this.setUsed(linkers[cableSet.linkers[0]], !(cableSet.el3 != null) ? linkers[cableSet.linkers[1]] : null);
                this.showCables();

                const thisCable = _(this).cables[_(this).cables.length - 1];
                thisCable.crosses = cableSet.crosses;
                // const cableConnections = new WeakMap();
                thisCable.cableConnections = new WeakMap();
                if(cableSet.cableConnections) {
                    thisCable.cableConnections.set(linkers[cableSet.cableConnections.linker], {cableIndex: cableSet.cableConnections.index});
                }
                // thisCable.cableConnections = cableConnections;
                // thisCable.cableConnections.set(linkers[cableSet.linkers[0]], cableSet.cableConnections);
                if(cableSet.ratio != null) thisCable.ratio = cableSet.ratio;
                if(cableSet.el3 != undefined) thisCable.el3 = cableSet.el3;

                // if(cableSet.el3 != undefined) thisCable.el3 = importData.cables[cableSet.el3];
            }

            for(let cableSet of _(this).cables)
                if(cableSet.el3 != undefined)
                    cableSet.el3 = _(this).cables[cableSet.el3];

            for(let elem of _(this).elements) {
                this.updateCables(elem.el);
            }

            this.showCables();
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