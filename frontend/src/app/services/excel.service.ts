import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  UploadResponse, 
  ParseResponse, 
  GenerateResponse,
  DroolsTableData 
} from '../models/drools-table.model';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  private apiUrl = '/api/excel';

  constructor(private http: HttpClient) {}

  uploadFile(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('excelFile', file);
    return this.http.post<UploadResponse>(`${this.apiUrl}/upload`, formData);
  }

  parseFile(filePath: string): Observable<ParseResponse> {
    return this.http.post<ParseResponse>(`${this.apiUrl}/parse`, { filePath });
  }

  generateFile(data: DroolsTableData): Observable<GenerateResponse> {
    return this.http.post<GenerateResponse>(`${this.apiUrl}/generate`, data);
  }
}
