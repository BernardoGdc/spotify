import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  loginURL: string = `https://accounts.spotify.com/authorize?client_id=${environment.client_id}&redirect_uri=${environment.redirect_url}&response_type=code`

  constructor(private http: HttpClient) {

  }
}
