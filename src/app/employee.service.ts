import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private apiBaseUrl = 'http://task.soft-zone.net/api/Employees/';

  constructor(private http: HttpClient) {}

  getAllEmployees() {
    return this.http.get<any[]>(this.apiBaseUrl + 'getAllEmployees');
  }

  addEmployee(employeeData: any) {
    return this.http.post<any>(this.apiBaseUrl + 'addEmployee', employeeData);
  }

  editEmployee(employeeData: any) {
    return this.http.post<any>(this.apiBaseUrl + 'editEmployee', employeeData);
  }

  deleteEmployee(empId: number) {
    return this.http.get<any>(this.apiBaseUrl + 'deleteEmpByID/' + empId);
  }
}
