import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { KnowledgeScout } from './knowledge-scout';

@Component({
  imports: [RouterLink, KnowledgeScout],
  template: `
    <div class="explorer">
      <header class="explorer__bar">
        <a routerLink="/" class="explorer__brand">Growing Humans</a>
        <a routerLink="/">← Back to Growing Humans</a>
      </header>
      <main class="explorer__main">
        <svg class="explorer__motif" viewBox="0 0 220 160" fill="none" aria-hidden="true">
          <path d="M106 159C91 117 90 71 102 8" />
          <path d="M96 82C70 45 43 30 16 36c5 33 29 55 80 46Z" />
          <path d="M104 115c23-51 54-70 95-64-10 42-42 66-95 64Z" />
        </svg>
        <p class="explorer__kicker">Follow a question somewhere new</p>
        <h1>The Knowledge Explorer</h1>
        <p class="explorer__lead">
          Choose a topic. Guess, reveal, wonder, and collect the ideas that stay with you.
        </p>
        <app-knowledge-scout [full]="true" />
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: radial-gradient(circle at 80% 0%, #282535, transparent 36%), #11121e;
        color: #faf7ff;
      }
      .explorer__bar {
        align-items: center;
        border-bottom: 1px solid #3d3c50;
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        justify-content: space-between;
        padding: 17px 5%;
      }
      .explorer__bar a {
        color: #e9d1ff;
        text-underline-offset: 4px;
      }
      .explorer__brand {
        color: #faf7ff !important;
        font:
          600 21px Georgia,
          serif;
        text-decoration: none;
      }
      .explorer__main {
        margin: auto;
        max-width: 1140px;
        padding: clamp(32px, 5vw, 56px) 5% 80px;
        position: relative;
      }
      .explorer__motif {
        height: 160px;
        opacity: 0.11;
        position: absolute;
        right: 3%;
        stroke: #d7bddb;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 1.2;
        top: 10px;
        width: 220px;
      }
      .explorer__kicker {
        color: #efaac3;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      h1 {
        font:
          600 clamp(36px, 5vw, 54px) / 1.05 Georgia,
          serif;
        letter-spacing: -0.04em;
        margin: 10px 0 14px;
      }
      .explorer__lead {
        color: #c0bfcc;
        font-size: 16px;
        line-height: 1.5;
        margin: 0 0 24px;
        max-width: 56ch;
      }
      :is(a):focus-visible {
        outline: 3px solid #efaac3;
        outline-offset: 3px;
      }
      @media (max-width: 620px) {
        .explorer__motif {
          display: none;
        }
        .explorer__lead {
          font-size: 16px;
        }
      }
    `,
  ],
})
export class KnowledgeExplorerPage {}
