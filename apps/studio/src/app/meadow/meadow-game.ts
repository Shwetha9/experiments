import { Component, ElementRef, HostListener, OnDestroy, ViewChild, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import story from './meadow-story.json';
import { MeadowExpedition } from './meadow-expedition';
import { createGame, GameState, MISSIONS, Mode, Move, moveMaze, passable, platformHazards, stepGame } from './meadow-engine';

type Slot = 'head'|'neck'|'cape'|'coat';
interface Pony {name:string; image:string; surprised:string}
interface Garment {id:string;name:string;slot:Slot;icon:string}
interface Save {pony:string;unlockedEpisode:number;won:string[];garments:string[];equipped:Partial<Record<Slot,string>>}
const KEY='moonbeam-meadow-v3';
const PONIES:Pony[]=[
  {name:'Mia',image:'images/meadow/pippa-winged.png',surprised:'images/meadow/pippa-surprised.png'},
  {name:'Clover',image:'images/meadow/clover-winged.png',surprised:'images/meadow/clover-surprised.png'},
  {name:'Violete',image:'images/meadow/miso-winged.png',surprised:'images/meadow/miso-surprised.png'},
];
const GARMENTS:Garment[]=[
  {id:'rose-cape',name:'Rose cape',slot:'cape',icon:'✦'},{id:'flower-crown',name:'Flower crown',slot:'head',icon:'✿'},
  {id:'sky-scarf',name:'Sky scarf',slot:'neck',icon:'〰'},{id:'star-coat',name:'Star coat',slot:'coat',icon:'✦'},
  {id:'moon-crown',name:'Moon crown',slot:'head',icon:'☾'},{id:'violet-cape',name:'Violet cape',slot:'cape',icon:'✦'},
  {id:'sun-scarf',name:'Sun scarf',slot:'neck',icon:'〰'},{id:'rainbow-coat',name:'Rainbow coat',slot:'coat',icon:'◆'},
];
@Component({selector:'app-meadow-game',imports:[RouterLink, MeadowExpedition],templateUrl:'./meadow-game.html',styleUrl:'./meadow-game.scss'})
export class MeadowGamePage implements OnDestroy {
  @ViewChild('gameCanvas') private canvas?:ElementRef<HTMLCanvasElement>;
  protected readonly ponies=PONIES;
  protected readonly missions=MISSIONS;
  protected readonly story=story.episodes;
  protected readonly stage=signal<'sky'|'choose'|'episodes'|'routes'|'intro'|'playing'|'result'>('sky');
  protected readonly pony=signal<Pony|null>(null);
  protected readonly episode=signal(0);
  protected readonly mode=signal<Mode>('platform');
  protected readonly introBeat=signal(0);
  protected readonly introReady=signal(false);
  protected readonly unlockedEpisode=signal(0);
  protected readonly won=signal<string[]>([]);
  protected readonly garments=signal<string[]>([]);
  protected readonly equipped=signal<Partial<Record<Slot,string>>>({});
  protected readonly gameView=signal({hearts:3,found:0,gem:false,flight:0,treasure:false,message:'',status:'playing'});
  protected readonly audioEnabled=signal(true);
  protected readonly selectedMission=computed(()=>MISSIONS[this.episode()]);
  protected readonly wardrobe=computed(()=>GARMENTS.filter(g=>this.garments().includes(g.id)));
  protected readonly saved=signal<Save|null>(this.readSave());
  private game:GameState|null=null;
  private frame=0; private lastFrame=0; private audio:HTMLAudioElement|null=null;
  private ponyImage=new Image(); private pressed=new Set<string>(); private mazeRepeat=0; private soundContext:AudioContext|null=null;
  protected selectPony(p:Pony):void {this.pony.set(p);this.ponyImage.src=p.image;this.stage.set('episodes');this.persist();}
  protected resume():void {const s=this.saved();if(!s)return;const p=PONIES.find(x=>x.name===(s.pony==='Miso'?'Violete':s.pony==='Pippa'?'Mia':s.pony))??PONIES[0];this.pony.set(p);this.ponyImage.src=p.image;this.unlockedEpisode.set(Math.min(3,Math.max(0,s.unlockedEpisode)));this.won.set(s.won??[]);this.garments.set(s.garments??[]);this.equipped.set(s.equipped??{});this.stage.set('episodes');this.persist();}
  protected openEpisode(index:number):void {if(index>this.unlockedEpisode())return;this.episode.set(index);this.stage.set('routes');}
  protected start(mode:Mode):void {this.stopAudio();this.pressed.clear();this.mode.set(mode);this.game=createGame(this.episode(),mode);this.gameView.set(this.snapshot());this.stage.set('playing');this.lastFrame=0;this.mazeRepeat=0;cancelAnimationFrame(this.frame);this.frame=requestAnimationFrame(t=>this.tick(t));}
  protected backToSky():void {this.stopGame();this.stage.set('sky');}
  protected backToEpisodes():void {this.stopGame();this.stage.set('episodes');}
  protected restart():void {this.start(this.mode());}
  protected chooseRoute(mode:Mode):void {this.mode.set(mode);this.introBeat.set(0);this.introReady.set(false);this.stage.set('intro');this.playIntroBeat();}
  protected skipIntro():void {this.stopAudio();this.start(this.mode());}
  protected beginRoute():void {if(this.introReady())this.start(this.mode());}
  protected toggleAudio():void {this.audioEnabled.update(x=>!x);if(!this.audioEnabled()){this.stopAudio();if(this.stage()==='intro'){this.introBeat.set(1);this.introReady.set(true);}}}
  protected equip(item:Garment):void {this.equipped.update(x=>({...x,[item.slot]:x[item.slot]===item.id?'':item.id}));this.persist();}
  protected hold(key:Move|'action',on:boolean):void {if(!this.game)return;const control=this.game.mode==='platform'&&key==='up'?'action':key;if(on)this.game.held.add(control);else this.game.held.delete(control);if(on&&this.game.mode==='chase'&&key!=='action')moveMaze(this.game,key);}
  private tick(time:number):void {
    if(!this.game||this.stage()!=='playing')return;
    const dt=this.lastFrame?Math.min(.05,(time-this.lastFrame)/1000):0;this.lastFrame=time;
    if(this.game.mode==='chase'){
      this.mazeRepeat+=dt;if(this.mazeRepeat>.14){this.mazeRepeat=0;const d=(['up','down','left','right'] as Move[]).find(x=>this.game?.held.has(x));if(d)moveMaze(this.game,d);}
    }
    const before=this.gameView();stepGame(this.game,dt);this.render(this.game);
    this.gameView.set(this.snapshot());
    const after=this.gameView();
    if(after.found>before.found){this.cue('found');if(after.found<3)this.narrate(`clue-${this.episode()*2+after.found}`);}
    if(after.treasure&&!before.treasure||after.gem&&!before.gem)this.cue('found');
    if(after.hearts<before.hearts)this.cue('hurt');
    if(this.game.status==='won'){this.finishWin();return;}
    if(this.game.status==='lost'){this.stage.set('result');return;}
    this.frame=requestAnimationFrame(t=>this.tick(t));
  }
  private finishWin():void {
    this.gameView.set(this.snapshot());
    const id=`${this.episode()}-${this.mode()}`;
    if(!this.won().includes(id))this.won.update(x=>[...x,id]);
    this.unlockedEpisode.update(x=>Math.max(x,Math.min(3,this.episode()+1)));
    const item=GARMENTS[this.episode()*2+(this.mode()==='chase'?1:0)];
    if(this.game?.treasure&&!this.garments().includes(item.id))this.garments.update(x=>[...x,item.id]);
    this.persist();this.stage.set('result');this.narrate(`episode-${this.episode()+1}-end`);
  }
  private snapshot(){const g=this.game;return {hearts:g?.hearts??3,found:g?.found.filter(Boolean).length??0,gem:g?.gem??false,flight:g?.flight??0,treasure:g?.treasure??false,message:g?.message??'',status:g?.status??'playing'};}
  private stopGame():void {cancelAnimationFrame(this.frame);this.game=null;this.pressed.clear();this.stopAudio();}
  private persist():void {if(!this.pony())return;const s:Save={pony:this.pony()!.name,unlockedEpisode:this.unlockedEpisode(),won:this.won(),garments:this.garments(),equipped:this.equipped()};try{localStorage.setItem(KEY,JSON.stringify(s));this.saved.set(s);}catch{/* storage unavailable */}}
  private readSave():Save|null {try{
    const raw=localStorage.getItem(KEY);if(raw)return JSON.parse(raw) as Save;
    const previous=localStorage.getItem('moonbeam-meadow-v2');if(!previous)return null;
    const old=JSON.parse(previous) as {pony?:string;levelIndex?:number;finished?:boolean;unlocked?:string[];equipped?:Partial<Record<Slot,string>>};
    const episode=old.finished?3:Math.min(3,Math.max(0,Math.floor((old.levelIndex??0)/2)));
    return {pony:old.pony??'Mia',unlockedEpisode:episode,won:Array.from({length:episode},(_,i)=>`${i}-platform`),garments:old.unlocked??[],equipped:old.equipped??{}};
  }catch{return null;}}
  private narrate(id:string,onEnd?:()=>void):void {this.stopAudio();if(!this.audioEnabled()){onEnd?.();return;}this.audio=new Audio(`audio/meadow/${id}.mp3`);this.audio.onended=()=>onEnd?.();this.audio.play().catch(()=>onEnd?.());}
  private playIntroBeat():void {
    const beat=this.introBeat(),id=this.story[this.episode()].scenes[beat].lineId;
    this.narrate(id,()=>{if(this.stage()!=='intro')return;if(beat===0){this.introBeat.set(1);this.playIntroBeat();}else this.introReady.set(true);});
  }
  private stopAudio():void {this.audio?.pause();this.audio=null;}
  private cue(kind:'found'|'hurt'):void {if(!this.audioEnabled())return;try{
    this.soundContext??=new AudioContext();const c=this.soundContext,o=c.createOscillator(),gain=c.createGain();
    o.type=kind==='found'?'sine':'sawtooth';o.frequency.setValueAtTime(kind==='found'?520:170,c.currentTime);
    o.frequency.exponentialRampToValueAtTime(kind==='found'?880:80,c.currentTime+.18);
    gain.gain.setValueAtTime(.08,c.currentTime);gain.gain.exponentialRampToValueAtTime(.001,c.currentTime+.22);
    o.connect(gain).connect(c.destination);o.start();o.stop(c.currentTime+.23);
  }catch{/* audio is optional */}}
  ngOnDestroy():void {this.stopGame();this.soundContext?.close();}
  @HostListener('window:keydown',['$event']) onKeyDown(e:KeyboardEvent):void {
    if(this.stage()!=='playing'||!this.game)return;
    const mapping:Record<string,Move|'action'>={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',' ':'action',Space:'action'};
    const key=mapping[e.key];if(!key)return;e.preventDefault();if(this.pressed.has(e.key))return;this.pressed.add(e.key);this.hold(key,true);
  }
  @HostListener('window:keyup',['$event']) onKeyUp(e:KeyboardEvent):void {this.pressed.delete(e.key);const mapping:Record<string,Move|'action'>={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',' ':'action',Space:'action'};const key=mapping[e.key];if(key)this.hold(key,false);}
  @HostListener('window:blur') onBlur():void {this.pressed.clear();this.game?.held.clear();}
  private render(g:GameState):void {const canvas=this.canvas?.nativeElement;if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;const [dark,mid,light]=MISSIONS[g.episode].palette;
    const sky=ctx.createLinearGradient(0,0,0,540);sky.addColorStop(0,dark);sky.addColorStop(.72,mid);sky.addColorStop(1,light);ctx.fillStyle=sky;ctx.fillRect(0,0,960,540);
    if(g.mode==='platform')this.drawPlatform(ctx,g);else this.drawMaze(ctx,g);
  }
  private drawPlatform(c:CanvasRenderingContext2D,g:GameState):void {
    c.save();c.translate(-g.camera,0);const mission=MISSIONS[g.episode];
    for(let x=0;x<2400;x+=300){c.fillStyle='#fff8';c.beginPath();c.ellipse(x+100,125+(x%3)*30,78,14,0,0,Math.PI*2);c.fill();}
    for(const p of mission.platforms){c.fillStyle=mission.palette[0];c.fillRect(p.x,p.y,p.w,540-p.y);c.fillStyle='#f2dfba';c.fillRect(p.x,p.y,p.w,9);}
    this.symbol(c,330,380,'◆','#6be0fa',30,!g.gem);
    [520,1160,1850].forEach((x,i)=>{const p=mission.platforms.find(q=>x>=q.x&&x<=q.x+q.w);this.symbol(c,x,(p?.y??455)-35,g.episode===1?'♫':g.episode===3?'◈':'✦','#ffe9a4',34,!g.found[i]);});
    this.symbol(c,1540,300,'▣','#ffd69a',32,!g.treasure);
    platformHazards(g).forEach(({x,y})=>{
      c.fillStyle=['#69365f','#3186a8','#d8edff','#b9a2db'][g.episode];
      c.beginPath();
      if(g.episode===2){c.moveTo(x,y-27);c.lineTo(x+18,y+22);c.lineTo(x-18,y+22);c.closePath();}
      else c.arc(x,y,g.episode===0?21:24,0,Math.PI*2);
      c.fill();
      this.symbol(c,x,y,['✺','♒','✧','◈'][g.episode],'#fff1e1',24,true);
    });
    c.fillStyle=g.found.every(Boolean)?'#e4c582':'#a69dab';c.fillRect(2260,355,22,100);this.symbol(c,2271,340,'✦','#fff3bd',26,true);
    if(g.invincible<=0||Math.floor(g.elapsed*10)%2===0)this.drawPony(c,g.x,g.y,g.facing,g.gem&&g.held.has('action')&&g.vy<0);
    c.restore();
  }
  private drawMaze(c:CanvasRenderingContext2D,g:GameState):void {
    const size=37,ox=91,oy=28;c.fillStyle='#101a35';c.fillRect(ox-8,oy-8,21*size+16,13*size+16);
    for(let y=0;y<13;y++)for(let x=0;x<21;x++){if(!passable(g,x,y)){c.fillStyle=MISSIONS[g.episode].palette[1];c.fillRect(ox+x*size+2,oy+y*size+2,size-4,size-4);}}
    const center=(p:{x:number;y:number})=>({x:ox+p.x*size+size/2,y:oy+p.y*size+size/2});
    [{x:3,y:1},{x:9,y:5},{x:17,y:11}].forEach((p,i)=>{const q=center(p);this.symbol(c,q.x,q.y,g.episode===1?'♫':g.episode===3?'◈':'✦','#ffe6a2',25,!g.found[i]);});
    this.symbol(c,center({x:5,y:7}).x,center({x:5,y:7}).y,'◆','#6be0fa',23,!g.gem);
    this.symbol(c,center({x:15,y:3}).x,center({x:15,y:3}).y,'▣','#ffd69a',22,!g.treasure);
    const exit=center({x:19,y:11});this.symbol(c,exit.x,exit.y,'✦',g.found.every(Boolean)?'#88ecd0':'#a6a4b2',30,true);
    g.enemies.forEach((e,i)=>{const p=center(e);c.fillStyle=['#9b4773','#563e7b','#377d91'][i];c.beginPath();c.arc(p.x,p.y,15,0,Math.PI*2);c.fill();this.symbol(c,p.x,p.y,['✺','♒','◉','♜'][g.episode],'#fff1df',21,true);});
    const p=center(g);if(g.invincible<=0||Math.floor(g.elapsed*10)%2===0)this.drawPony(c,p.x,p.y-19,g.facing,false,48);
  }
  private drawPony(c:CanvasRenderingContext2D,x:number,y:number,facing:1|-1,flying:boolean,size=76):void {if(!this.ponyImage.complete)return;c.save();c.translate(x,y+(flying?-12:0));c.scale(facing,1);c.drawImage(this.ponyImage,-size/2,-size/2,size,size);c.restore();}
  private symbol(c:CanvasRenderingContext2D,x:number,y:number,s:string,color:string,size:number,show:boolean):void {if(!show)return;c.save();c.fillStyle=color;c.shadowBlur=14;c.shadowColor=color;c.font=`bold ${size}px Georgia`;c.textAlign='center';c.textBaseline='middle';c.fillText(s,x,y);c.restore();}
}
