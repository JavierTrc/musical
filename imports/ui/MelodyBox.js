import React, { Component } from 'react';
import './MelodyBox.css';
import  'meteor/sorenpeterson:createjs';

export default class MelodyBox extends Component {
    
    constructor (props){
        super(props);
        this.state = {
            boxState: Array(12).fill().map( () => Array(14).fill(false))
        };
        this.cells = Array(12).fill().map( () => Array(14));
        this.dots = Array(12).fill().map( () => Array(14));
        this.colorCommands = Array(12).fill().map( () => Array(14));
        this.colorMatrix = Array(12).fill().map( () => Array(14));
        this.colors = [{r:78 , g: 97 , b: 216},
                       {r:165, g: 66 , b: 177},
                       {r:247, g: 88 , b: 57 },
                       {r:247, g: 148, b: 61 },
                       {r:209, g: 193, b: 46 },
                       {r:75 , g: 178, b: 80 },
                       {r:69 , g: 152, b: 182}];
        this.toggleAnimation = this.toggleAnimation.bind(this);
        this.tweenMatrix = Array(12).fill().map( () => Array(14));
        this.running = false;
    }

    resizeCanvasToDisplaySize(canvas) {
        // look up the size the canvas is being displayed
        if(canvas!=null){
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
        
            // If it's resolution does not match change it
            if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            return true;
            }
        
            return false;
        }
     }
    drawMatrix(){
        this.stage = new createjs.Stage("mainCanvas");
        const width = this.mainCanvas.width;
        const height = this.mainCanvas.height;
        const X =  this.cells.length;
        const Y = this.cells[0].length;
        this.stage.enableMouseOver(20);
        this.stage.canvas.style.cursor = "pointer";
        for(let i = 0 ; i < X; i++){
            for(let j = 0 ; j < Y; j++){
                this.cells[i][j] = new createjs.Shape();
                this.dots[i][j] = new createjs.Shape();
                let size = Math.min(height/(Y*16),width/(X*30));
                this.dots[i][j].graphics.beginFill("Grey").drawCircle(i*(width/X)+width/(2*X)-size/2,j*(height/Y)+height/(2*X)-size/2,size);
                this.colorMatrix[i][j] = this.colors[j%7];
                this.colorCommands[i][j] = this.cells[i][j].graphics.beginFill(createjs.Graphics.getRGB(this.colors[j%7].r, this.colors[j%7].g, this.colors[j%7].b )).command;
                this.cells[i][j].graphics.drawRect(i*(width/X),j*(height/Y),width/X-1,height/Y-1);
                var hit = new createjs.Shape();
                hit.graphics.beginFill("#000").drawRect(i*(width/X),j*(height/Y),width/X-1,height/Y-1);
                
                this.cells[i][j].hitArea = hit;
                this.dots[i][j].hitArea = hit;
                this.cells[i][j].addEventListener("click",this.getClickFunction(i,j,this.stage));
                this.dots[i][j].addEventListener("click",this.getClickFunction(i,j,this.stage));
                this.cells[i][j].addEventListener("mouseover", this.getMouseOverFunction(i,j,this.stage));
                this.cells[i][j].addEventListener("mouseout", this.getMouseOverFunction(i,j,this.stage));
                this.dots[i][j].addEventListener("mouseover", this.getMouseOverFunction(i,j,this.stage));
                this.dots[i][j].addEventListener("mouseout", this.getMouseOverFunction(i,j,this.stage));
                this.dots[i][j].alpha = (this.state.boxState[i][j])?0:1;
                this.cells[i][j].alpha = (this.state.boxState[i][j])?1:0;
                
                
                this.stage.addChild(this.cells[i][j]);
                this.stage.addChild(this.dots[i][j]);
                this.cells[i][j].cursor = "pointer";
                this.dots[i][j].cursor = "pointer";
            }
        }
        createjs.Ticker.setFPS(100);
        createjs.Ticker.addEventListener("tick",this.stage);
        this.stage.update();
    }
    getClickFunction(i,j,stage){
        return ()=>{
            let newBoxState = this.state.boxState ;
            newBoxState[i][j] = !newBoxState[i][j];

            this.dots[i][j].alpha = (newBoxState[i][j])?0:1;
            this.cells[i][j].alpha = (newBoxState[i][j])?1:0;
            this.setState({
                boxState: newBoxState
            });

            stage.update();
          
        };
    }
    getMouseOverFunction(i,j,stage){
        return ((event) => {
            
            if(this.state.boxState[i][j]){
                this.cells[i][j].alpha = (event.type == "mouseover") ? 0.5:1 ; 
                stage.update();
            }
            else{
                this.cells[i][j].alpha = (event.type == "mouseover") ? 0.5:0 ; 
                stage.update();
            }
        });
    }
    componentDidMount(){
        this.drawMatrix();
    }

    createChangeColorAnimation(i,j,stage){
        return ((event)=> {
            this.colorCommands[i][j].style = createjs.Graphics.getRGB(Math.floor(this.colorMatrix[i][j].r),Math.floor(this.colorMatrix[i][j].g),Math.floor(this.colorMatrix[i][j].b))
        });
    }
    createTween(i,j,X,startingPoint){
        startingPoint = 0; //Por ahora no se como implementar shifts
        const note = 150;
        const fadeIn = 15;
        const fadeOut = 150;
        const phase = i * note;
        const total = X * note;
        this.colorMatrix[i][j]  = this.colors[j%7];
        this.createChangeColorAnimation(i,j,this.stage)();
        if (i==0){
            this.tweenMatrix[i][j] = createjs.Tween.get(this.colorMatrix[i][j], {loop:true})
            .to({r:0,g:0,b:0},0)
            .wait(note)
            .to(this.colors[j%7],fadeOut)
            .wait(total-note-fadeOut-fadeIn)
            .to({r:0,g:0,b:0},fadeIn);
        } else if (i == X-1) {
            this.colorMatrix[i][j]  = {r:0, g:0, b:0};
            this.createChangeColorAnimation(i,j,this.stage)();
            this.tweenMatrix[i][j] = createjs.Tween.get(this.colorMatrix[i][j], {loop:true})
            .to(this.colors[j%7],fadeOut)
            .wait(phase-fadeIn-fadeOut)
            .to({r:0,g:0,b:0},fadeIn)
            .wait(note);
        } else {
            this.tweenMatrix[i][j] = createjs.Tween.get(this.colorMatrix[i][j], {loop:true})
            .wait(phase-fadeIn)
            .to({r:0,g:0,b:0},fadeIn)
            .wait(note)
            .to(this.colors[j%7],fadeOut)
            .wait(total-note-fadeOut-phase);
        }
        this.tweenMatrix[i][j].addEventListener("change", this.createChangeColorAnimation(i,j,this.stage));
    }
    toggleAnimation(){
        const X = this.cells.length;
        const Y = this.cells[0].length;
        if(!this.running){
            this.running = true;
            for(let i = 0 ; i < X; i++){
                for(let j = 0 ; j < Y; j++){
                    if(this.state.boxState[i][j]){
                        this.colorMatrix[i][j]  = this.colors[j%7];
                        this.createChangeColorAnimation(i,j,this.stage)();
                        this.createTween(i,j,X,0);
                    }
                }
            }
            this.stage.update();
        } else{
            this.running = false;
            createjs.Tween.removeAllTweens();
            for(let i = 0 ; i < X; i++){
                for(let j = 0 ; j < Y; j++){
                    if(this.state.boxState[i][j]){
                        this.colorMatrix[i][j]  = this.colors[j%7];
                        this.createChangeColorAnimation(i,j,this.stage)();
                    }
                }
            }
        }
    }

    render(){
        return (
            <div>
                <canvas id="mainCanvas"
                ref ={(mainCanvas) => {this.mainCanvas = mainCanvas; this.resizeCanvasToDisplaySize(mainCanvas)}} />
                <div>
                    <button onClick={this.toggleAnimation}>Try animate pls</button>
                </div> 
            </div>
        );
    }
}