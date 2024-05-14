import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SpotifyApiService {

  constructor(private http: HttpClient) { }

  getAccessCode(authCode: string) : Observable<any>{

    let accessCode: Object
    let authorization = btoa(`${environment.client_id}:${environment.client_secret}`)
    const body = new URLSearchParams();
    body.set('grant_type', 'client_credentials')
    body.set('code', authCode)
    body.set('redirect_uri', environment.redirect_url)

    let headers = new HttpHeaders({
        'Authorization': `Basic ${authorization}`,
        'Content-Type': 'application/x-www-form-urlencoded'
    })
    return this.http.post(`${environment.base_url}api/token`, body.toString() , { headers }).pipe(
        map(res => {
            return res
        })
    )
  }
  
}