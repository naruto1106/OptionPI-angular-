import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'ow-main-watchlist-tab',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.css']
})
export class WatchListComponent implements OnInit {

  @Output() currentMainTab = new EventEmitter();

  constructor(
    private router: Router,
    private auth: AngularFireAuth
  ) { }

  ngOnInit(): void {

    //setTimeout(() => {
      //Set this after API call completed to switch the main tabs
      //this.currentMainTab.emit('screener');
    //}, 3000);

  }

}