export type Mode = 'platform' | 'chase';
export type Move = 'left' | 'right' | 'up' | 'down';
export interface Point { x: number; y: number }
export interface Platform { x: number; y: number; w: number }
export interface Mission {
  title: string; setting: string; objective: string; enemy: string; object: string; hazard: string;
  palette: [string,string,string]; platforms: Platform[]; maze: string[];
}
export const MISSIONS: Mission[] = [
  { title:'The Map That Vanished', setting:'The cloud bridge', objective:'Recover three torn map stars and escape the wind sprites.', enemy:'Wind sprite', object:'map star', hazard:'wind gust', palette:['#273a63','#bd8fb8','#f7cb91'], platforms:[{x:0,y:460,w:570},{x:650,y:420,w:220},{x:970,y:370,w:210},{x:1280,y:430,w:250},{x:1630,y:380,w:230},{x:1960,y:455,w:440}], maze:[
'#####################','#...#.....#.......#.#','#.#.#.###.#.#####.#.#','#.#...#...#.....#...#','#.#####.#####.#.###.#','#.....#.....#.#.....#','###.#.#####.#.#####.#','#...#.....#...#...#.#','#.#######.#####.#.#.#','#...#.....#.....#...#','#.#.#.###.#.#######.#','#.#.......#.........#','#####################'] },
  { title:'The Bell Beneath the Brook', setting:'Glitter Brook', objective:'Find three silver bell notes while the river guardians patrol.', enemy:'River guardian', object:'bell note', hazard:'river current', palette:['#173e59','#5a9caa','#a9dbd1'], platforms:[{x:0,y:455,w:500},{x:610,y:405,w:210},{x:920,y:455,w:300},{x:1330,y:360,w:250},{x:1680,y:420,w:250},{x:2020,y:455,w:380}], maze:[
'#####################','#.....#.............#','#.###.#.###.#.#####.#','#...#...#...#...#...#','###.#####.#####.#.#.#','#...#.....#.....#.#.#','#.###.###.#.#####.#.#','#.....#...#...#...#.#','#.#####.#####.#.###.#','#.#...#.....#.#.....#','#.#.#.#####.#.#####.#','#...#.......#.......#','#####################'] },
  { title:'The Tower of Borrowed Stars', setting:'Frosted Sky', objective:'Gather three lost stars before the tower shadows reach you.', enemy:'Tower shadow', object:'lost star', hazard:'ice shard', palette:['#202e58','#7188b4','#d6d4e8'], platforms:[{x:0,y:455,w:460},{x:540,y:390,w:230},{x:880,y:320,w:210},{x:1200,y:395,w:230},{x:1540,y:340,w:240},{x:1880,y:455,w:520}], maze:[
'#####################','#.......#.....#.....#','#.#####.#.###.#.###.#','#.#.....#...#...#...#','#.#.#######.#####.#.#','#...#.....#.....#.#.#','###.#.###.#####.#.#.#','#...#...#.....#...#.#','#.#####.#####.#####.#','#.#.....#...#.......#','#.#.###.#.#.#######.#','#...#...#.#.........#','#####################'] },
  { title:'The Moon Castle Promise', setting:'Moon Castle', objective:'Light three beacons and outrun the castle sentinels.', enemy:'Castle sentinel', object:'beacon', hazard:'falling moonstone', palette:['#242445','#786898','#e9b6aa'], platforms:[{x:0,y:455,w:520},{x:630,y:370,w:230},{x:960,y:420,w:240},{x:1300,y:335,w:270},{x:1680,y:405,w:230},{x:2000,y:455,w:400}], maze:[
'#####################','#.......#.....#.....#','#.#####.#.###.#.###.#','#.....#...#...#...#.#','#####.#####.#####.#.#','#.....#.....#.....#.#','#.#####.###.#.###.#.#','#...#.....#.#...#...#','###.#.#####.###.#####','#...#.#.....#.......#','#.###.#.###.#######.#','#.....#...#.........#','#####################'] },
];
export interface GameState {
  mode: Mode; episode: number; x: number; y: number; vx: number; vy: number; camera: number;
  hearts: number; elapsed: number; gem: boolean; flight: number; found: boolean[]; treasure: boolean;
  invincible: number; checkpoint: Point; enemies: Point[]; enemyStep: number; maze: string[];
  held: Set<Move | 'action'>; facing: 1 | -1; status: 'playing'|'won'|'lost'; message: string;
}
const ITEM_X = [520, 1160, 1850];
const MAZE_ITEMS: Point[] = [{x:3,y:1},{x:9,y:5},{x:17,y:11}];
const STORY_BEATS = [
  ['The first star was torn from the Moonbeam Map.','The cloud keeper heard a silver bell.','The map corner points toward Glitter Brook.'],
  ['The brook is silent, but the bell still glows.','A fish remembers the bell’s four-note rhythm.','The echo climbs toward a snowy tower.'],
  ['These stars were carried by someone small.','The sky fox borrowed them to light the dark.','The fox knows the way to Moon Castle.'],
  ['The first beacon wakes. The bridge steadies.','The second beacon answers across the sky.','The final light opens the castle path.'],
];
export function platformHazards(g:GameState):Point[] {
  const bases=[780,1380,2070],platforms=MISSIONS[g.episode].platforms;
  return bases.map((base,i)=>{
    const platform=platforms.find(p=>base>=p.x&&base<=p.x+p.w);
    const floor=(platform?.y??455)-38;
    if(g.episode===0)return {x:base+Math.sin(g.elapsed*(1.6+i*.3))*65,y:floor};
    if(g.episode===1)return {x:base+Math.sin(g.elapsed*(1.2+i*.2))*45,y:floor+Math.sin(g.elapsed*3+i)*12};
    if(g.episode===2)return {x:base,y:175+((g.elapsed*130+i*170)%300)};
    return {x:base+Math.sin(g.elapsed*(2+i*.25))*55,y:floor-25-Math.abs(Math.sin(g.elapsed*3+i))*70};
  });
}
export function createGame(episode:number, mode:Mode):GameState {
  const mission = MISSIONS[episode];
  const maze = mission.maze.map(row=>row.replace(/[^.#]/g,'.'));
  return {mode,episode,x:mode==='platform'?60:1,y:mode==='platform'?400:1,vx:0,vy:0,camera:0,hearts:3,elapsed:0,gem:false,flight:0,found:[false,false,false],treasure:false,invincible:0,checkpoint:{x:mode==='platform'?60:1,y:mode==='platform'?400:1},enemies:mode==='platform'?[]:[{x:17,y:1},{x:15,y:9},{x:9,y:11}],enemyStep:0,maze,held:new Set(),facing:1,status:'playing',message:mission.objective};
}
export function passable(game:GameState,x:number,y:number):boolean {return y>=0&&y<13&&x>=0&&x<21&&game.maze[y][x]==='.';}
function touch(a:Point,b:Point,r:number):boolean{return Math.hypot(a.x-b.x,a.y-b.y)<r;}
function damage(game:GameState):void {if(game.invincible>0||game.status!=='playing')return;game.hearts--;game.invincible=1.8;game.x=game.checkpoint.x;game.y=game.checkpoint.y;game.vx=0;game.vy=0;game.message=game.hearts?'Ouch! Try another route.':'The chapter can be retried.';if(!game.hearts)game.status='lost';}
export function stepGame(game:GameState,dt:number):void {
  if(game.status!=='playing')return;dt=Math.min(dt,.04);game.elapsed+=dt;game.invincible=Math.max(0,game.invincible-dt);
  if(game.mode==='platform')stepPlatform(game,dt);else stepChase(game,dt);
}
function stepPlatform(g:GameState,dt:number):void {
  const platforms=MISSIONS[g.episode].platforms;const oldFeet=g.y+54;
  const horizontal=(g.held.has('right')?1:0)-(g.held.has('left')?1:0);
  g.vx=horizontal*245;if(horizontal)g.facing=horizontal as 1|-1;g.x=Math.max(18,Math.min(2320,g.x+g.vx*dt));
  const onGround=platforms.some(p=>Math.abs(oldFeet-p.y)<3&&g.x+26>p.x&&g.x-26<p.x+p.w);
  if(g.held.has('action')&&onGround)g.vy=-440;
  if(g.gem&&g.held.has('action')&&!onGround&&g.flight>0){g.vy=Math.max(-190,g.vy-780*dt);g.flight=Math.max(0,g.flight-dt*24);}
  else if(onGround)g.flight=Math.min(100,g.flight+dt*60);
  g.vy=Math.min(620,g.vy+980*dt);g.y+=g.vy*dt;
  if(g.vy>=0){for(const p of platforms){if(oldFeet<=p.y+5&&g.y+54>=p.y&&g.x+23>p.x&&g.x-23<p.x+p.w){g.y=p.y-54;g.vy=0;break;}}}
  if(g.y>600)damage(g);
  const gem={x:330,y:380};if(!g.gem&&touch(g,gem,48)){g.gem=true;g.flight=100;g.message='Blue gem found! Hold jump to fly. Wings recharge when you land.';}
  ITEM_X.forEach((x,i)=>{const p=platforms.find(q=>x>=q.x&&x<=q.x+q.w);const y=(p?.y??455)-35;if(!g.found[i]&&touch(g,{x,y},52)){g.found[i]=true;g.message=STORY_BEATS[g.episode][i];if(i===1)g.checkpoint={x:g.x,y:g.y};}});
  const treasure={x:1540,y:300};if(!g.treasure&&touch(g,treasure,58)){g.treasure=true;g.message='Clothing treasure found!';}
  platformHazards(g).forEach(enemy=>{if(touch(g,enemy,37))damage(g);});
  if(g.x>2240){if(g.found.every(Boolean)){g.status='won';g.message='Route cleared! The next episode is unlocked.';}else g.message='The gate needs all three story pieces.';}
  g.camera=Math.max(0,Math.min(1440,g.x-350));
}
export function moveMaze(g:GameState,dir:Move):void {
  if(g.mode!=='chase'||g.status!=='playing')return;const dx=dir==='left'?-1:dir==='right'?1:0,dy=dir==='up'?-1:dir==='down'?1:0;
  if(!passable(g,g.x+dx,g.y+dy))return;g.x+=dx;g.y+=dy;if(dx)g.facing=dx as 1|-1;
  MAZE_ITEMS.forEach((p,i)=>{if(!g.found[i]&&touch(g,p,.1)){g.found[i]=true;g.message=STORY_BEATS[g.episode][i];}});
  if(!g.gem&&touch(g,{x:5,y:7},.1)){g.gem=true;g.flight=8;g.message='Blue gem! The sentinels cannot hurt you for a short time.';}
  if(!g.treasure&&touch(g,{x:15,y:3},.1)){g.treasure=true;g.message='Clothing treasure found!';}
  if(g.x===19&&g.y===11){if(g.found.every(Boolean)){g.status='won';g.message='Route cleared! The next episode is unlocked.';}else g.message='Find all three story pieces before leaving.';}
  if(g.enemies.some(enemy=>touch(g,enemy,.1))&&g.flight<=0)damage(g);
}
function stepChase(g:GameState,dt:number):void {
  g.flight=Math.max(0,g.flight-dt);g.enemyStep+=dt;
  if(g.enemyStep<.28)return;g.enemyStep=0;
  const dirs:[[number,number],[number,number],[number,number],[number,number]]=[[1,0],[-1,0],[0,1],[0,-1]];
  g.enemies=g.enemies.map((enemy,i)=>{
    const choices=dirs.map(([dx,dy])=>({x:enemy.x+dx,y:enemy.y+dy})).filter(p=>passable(g,p.x,p.y));
    choices.sort((a,b)=>{
      // One guard patrols away from the pony; the others find actual corridors.
      const da=mazeDistance(g,a,g),db=mazeDistance(g,b,g);
      return (i===1?db-da:da-db)||Math.random()-.5;
    });
    return choices[0]??enemy;
  });
  if(g.flight<=0&&g.enemies.some(enemy=>touch(g,enemy,.1)))damage(g);
}
function mazeDistance(g:GameState,from:Point,to:Point):number {
  const queue:[number,number,number][]=[[from.x,from.y,0]],seen=new Set([`${from.x},${from.y}`]);
  for(const [x,y,d] of queue){
    if(x===to.x&&y===to.y)return d;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;
      if(passable(g,nx,ny)&&!seen.has(key)){seen.add(key);queue.push([nx,ny,d+1]);}
    }
  }
  return 999;
}
