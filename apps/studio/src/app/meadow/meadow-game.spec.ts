import { Component, output } from '@angular/core';
import { MeadowExpedition } from './meadow-expedition';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MeadowGamePage } from './meadow-game';
import { createGame, MISSIONS, moveMaze, passable, stepGame } from './meadow-engine';

@Component({selector:'app-meadow-expedition',template:'<button class="arcade-link" (click)="arcade.emit()">Arcade trials</button>'})
class ExpeditionStub {readonly arcade=output<void>();}

function reachable(episode:number):Set<string>{
  const g=createGame(episode,'chase'),queue=[[1,1]],seen=new Set(['1,1']);
  for(const [x,y] of queue){for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;
    if(passable(g,nx,ny)&&!seen.has(key)){seen.add(key);queue.push([nx,ny]);}
  }}return seen;
}

describe('Moonbeam Meadow episode routes',()=>{
  it('keeps all story pieces, gems, treasures and exits reachable in every chase maze',()=>{
    expect(MISSIONS.length).toBe(4);
    for(let episode=0;episode<4;episode++){
      const visited=reachable(episode);
      for(const point of ['3,1','9,5','17,11','5,7','15,3','19,11'])expect(visited.has(point)).withContext(`episode ${episode+1}: ${point}`).toBeTrue();
    }
  });
  it('requires three story pieces, then accepts either route as a win',()=>{
    for(let episode=0;episode<4;episode++){
      const maze=createGame(episode,'chase');maze.enemies=[];maze.x=18;maze.y=11;moveMaze(maze,'right');expect(maze.status).toBe('playing');
      maze.found=[true,true,true];maze.x=18;maze.y=11;moveMaze(maze,'right');expect(maze.status).toBe('won');
      const platform=createGame(episode,'platform');platform.x=2230;stepGame(platform,.04);expect(platform.status).toBe('playing');
      platform.found=[true,true,true];platform.x=2241;stepGame(platform,.04);expect(platform.status).toBe('won');
    }
  });
  it('does not allow flight before collecting the blue gem',()=>{
    const g=createGame(0,'platform');g.x=330;g.y=380;stepGame(g,.016);expect(g.gem).toBeTrue();
    g.y=200;g.vy=0;g.held.add('action');const before=g.flight;stepGame(g,.04);expect(g.flight).toBeLessThan(before);
  });
  beforeEach(async()=>{localStorage.clear();await TestBed.configureTestingModule({imports:[MeadowGamePage],providers:[provideRouter([])]}).overrideComponent(MeadowGamePage,{remove:{imports:[MeadowExpedition]},add:{imports:[ExpeditionStub]}}).compileComponents();});
  it('shows two routes per unlocked episode and keeps later episodes locked',()=>{
    const fixture=TestBed.createComponent(MeadowGamePage);fixture.detectChanges();const page=fixture.nativeElement as HTMLElement;page.querySelector<HTMLButtonElement>('.arcade-link')!.click();fixture.detectChanges();
    expect(page.querySelectorAll('.friends button')).toHaveSize(3);
    page.querySelector<HTMLButtonElement>('.friends button')!.click();fixture.detectChanges();
    const episodes=page.querySelectorAll<HTMLButtonElement>('.episode');expect(episodes).toHaveSize(4);expect(episodes[0].disabled).toBeFalse();expect(episodes[1].disabled).toBeTrue();
    episodes[0].click();fixture.detectChanges();expect(page.querySelectorAll('.route-grid button')).toHaveSize(2);
  });
  it('plays the opening scene before the route and supports Up plus Right to jump forward',()=>{
    const fixture=TestBed.createComponent(MeadowGamePage);fixture.detectChanges();const page=fixture.nativeElement as HTMLElement;page.querySelector<HTMLButtonElement>('.arcade-link')!.click();fixture.detectChanges();
    page.querySelector<HTMLButtonElement>('.sound')!.click();
    page.querySelector<HTMLButtonElement>('.friends button')!.click();fixture.detectChanges();
    page.querySelector<HTMLButtonElement>('.episode')!.click();fixture.detectChanges();
    page.querySelector<HTMLButtonElement>('.route-grid button')!.click();fixture.detectChanges();
    expect(page.querySelector('.cinema')).not.toBeNull();
    page.querySelector<HTMLButtonElement>('.cinema__actions .primary')!.click();fixture.detectChanges();
    const component=fixture.componentInstance;
    const game=(component as unknown as {game:ReturnType<typeof createGame>}).game;
    game.y=406;game.x=100;
    component.onKeyDown(new KeyboardEvent('keydown',{key:'ArrowUp'}));
    component.onKeyDown(new KeyboardEvent('keydown',{key:'ArrowRight'}));
    stepGame(game,.04);
    expect(game.vy).toBeLessThan(0);expect(game.x).toBeGreaterThan(100);
    fixture.destroy();
  });
  it('unlocks the next episode after either route wins',()=>{
    const fixture=TestBed.createComponent(MeadowGamePage);fixture.detectChanges();const page=fixture.nativeElement as HTMLElement;page.querySelector<HTMLButtonElement>('.arcade-link')!.click();fixture.detectChanges();
    page.querySelector<HTMLButtonElement>('.sound')!.click();page.querySelector<HTMLButtonElement>('.friends button')!.click();fixture.detectChanges();
    page.querySelector<HTMLButtonElement>('.episode')!.click();fixture.detectChanges();
    page.querySelectorAll<HTMLButtonElement>('.route-grid button')[1].click();fixture.detectChanges();
    page.querySelector<HTMLButtonElement>('.cinema__actions .primary')!.click();fixture.detectChanges();
    const component=fixture.componentInstance as unknown as {game:ReturnType<typeof createGame>;finishWin:()=>void};
    component.game.status='won';component.finishWin();fixture.detectChanges();
    page.querySelector<HTMLButtonElement>('.result .primary')!.click();fixture.detectChanges();
    expect(page.querySelectorAll<HTMLButtonElement>('.episode')[1].disabled).toBeFalse();
    expect(localStorage.getItem('moonbeam-meadow-v3')).toContain('0-chase');
    fixture.destroy();
  });
  it('restores pony and unlocked episodes from browser storage',()=>{
    localStorage.setItem('moonbeam-meadow-v3',JSON.stringify({pony:'Miso',unlockedEpisode:2,won:['0-chase','1-platform'],garments:[],equipped:{}}));
    const fixture=TestBed.createComponent(MeadowGamePage);fixture.detectChanges();const page=fixture.nativeElement as HTMLElement;page.querySelector<HTMLButtonElement>('.arcade-link')!.click();fixture.detectChanges();
    page.querySelector<HTMLButtonElement>('.resume')!.click();fixture.detectChanges();
    const episodes=page.querySelectorAll<HTMLButtonElement>('.episode');expect(episodes[2].disabled).toBeFalse();expect(episodes[3].disabled).toBeTrue();
  });
  it('carries an earlier adventure into the new episode map',()=>{
    localStorage.setItem('moonbeam-meadow-v2',JSON.stringify({pony:'Clover',levelIndex:4,unlocked:['rose-cape'],equipped:{cape:'rose-cape'}}));
    const fixture=TestBed.createComponent(MeadowGamePage);fixture.detectChanges();const page=fixture.nativeElement as HTMLElement;page.querySelector<HTMLButtonElement>('.arcade-link')!.click();fixture.detectChanges();
    page.querySelector<HTMLButtonElement>('.resume')!.click();fixture.detectChanges();
    expect(page.textContent).toContain("Clover's adventure");
    expect(page.querySelectorAll<HTMLButtonElement>('.episode')[2].disabled).toBeFalse();
    expect(page.querySelector('.dressed-pony')?.getAttribute('data-cape')).toBe('rose-cape');
    fixture.destroy();
  });
});
