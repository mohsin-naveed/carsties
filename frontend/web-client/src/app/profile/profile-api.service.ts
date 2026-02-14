import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export type UserType = 'Individual' | 'Dealer' | 'Admin';

export interface UserProfileDto {
  id: string;
  identityUserId: string;
  email: string;
  userType: UserType;
  displayName?: string | null;
  phoneNumber?: string | null;
  country?: string | null;
  city?: string | null;
  companyName?: string | null;
  companyRegistrationNumber?: string | null;
  isProfileComplete: boolean;
}

export interface UpsertMeRequest {
  email: string;
  userType: UserType;
  displayName?: string | null;
  phoneNumber?: string | null;
  country?: string | null;
  city?: string | null;
  companyName?: string | null;
  companyRegistrationNumber?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileApiService {
  private baseUrl = environment.userApiBaseUrl;

  constructor(private http: HttpClient) {}

  getMe(): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(`${this.baseUrl}/profiles/me`);
  }

  upsertMe(payload: UpsertMeRequest): Observable<UserProfileDto> {
    return this.http.put<UserProfileDto>(`${this.baseUrl}/profiles/me`, payload);
  }

  deleteMe(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/profiles/me`);
  }
}
