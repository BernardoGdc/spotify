import { Component } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { SpotifyApiService } from '../services/spotifyapi';
import { environment } from '../../environments/environment';
import { waitForAsync } from '@angular/core/testing';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  authCode: string = ''
  accessCode: any

  constructor(private route: ActivatedRoute, private spotifyApi: SpotifyApiService){

  }

  ngOnInit() {
    this.route.queryParams.subscribe((params: Params) => {
      this.authCode = params['code'];
      console.log(this.authCode );
      this.spotifyApi.getAccessCode(this.authCode).subscribe((res: any) => {
        this.accessCode = res
        console.log(this.accessCode)
      })
      console.log(this.accessCode)
    })

} 
}
