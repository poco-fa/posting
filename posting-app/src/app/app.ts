import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('posting-app');

  ngOnInit() {
    let login_name = localStorage.getItem('login_name');
    while(!login_name || login_name.trim() === '') {
      alert('党員番号が入力されていません。');
      login_name = prompt('党員番号を入力してください');
    }
    localStorage.setItem('login_name',login_name);
  }
}
