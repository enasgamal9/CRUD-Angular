import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import axios from 'axios';

@Component({
  selector: 'app-loader',
  template: `
    <div class="overlay">
      <div class="loader"></div>
    </div>
  `,
  styles: [
    `
      .overlay {
        background-color: rgba(0, 0, 0, 0.5);
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .loader {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 2s linear infinite;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class LoaderComponent {}


@Component({
  selector: 'app-root',
  template: `
  <h1>Employee Management</h1>
  <button class="btn btn-primary" (click)="showAddPopup()"> <i class="fas fa-plus"></i></button>
<app-employee-grid
  [employees]="employees"
  (delete)="deleteEmployee($event)"
  (edit)="showEditPopup($event)"
></app-employee-grid>
    <div class="overlay" *ngIf="showingPopup">
      <div class="popup">
        <h2>{{ popupTitle }}</h2>
        <form [formGroup]="employeeForm">
          <label>Name:</label>
          <input type="text" formControlName="empName" />
          <div *ngIf="employeeForm.get('empName')!.invalid && employeeForm.get('empName')!.touched">
            <div *ngIf="employeeForm.get('empName')!.hasError('required')">Name is required.</div>
          </div>

          <label>Email:</label>
          <input type="email" formControlName="empEmail" />
          <div *ngIf="employeeForm.get('empEmail')!.invalid && employeeForm.get('empEmail')!.touched">
            <div *ngIf="employeeForm.get('empEmail')!.hasError('required')">Email is required.</div>
            <div *ngIf="employeeForm.get('empEmail')!.hasError('empEmail')">Invalid Email format.</div>
          </div>

          <label>Mobile:</label>
          <input type="text" formControlName="empPhone" />
          <div *ngIf="employeeForm.get('empPhone')!.invalid && employeeForm.get('empPhone')!.touched">
            <div *ngIf="employeeForm.get('empPhone')!.hasError('required')">Mobile is required.</div>
            <div *ngIf="employeeForm.get('empPhone')!.hasError('pattern')">Invalid mobile format.</div>
          </div>

          <label>Address:</label>
          <input type="text" formControlName="empAddress" />
          <div *ngIf="employeeForm.get('empAddress')!.invalid && employeeForm.get('empAddress')!.touched">
            <div *ngIf="employeeForm.get('empAddress')!.hasError('required')">Address is required.</div>
          </div>

          <button type="button" (click)="saveEmployee()" [disabled]="employeeForm.invalid || saving">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
          <button type="button" (click)="closePopup()">Cancel</button>
        </form>
      </div>
    </div>
    <app-loader *ngIf="loading"></app-loader>
  `,
  styles: [
    `
      .overlay {
        background-color: rgba(0, 0, 0, 0.5);
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .popup {
        background-color: #fff;
        padding: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  employees: any[] = [];
  showingPopup = false;
  popupTitle = '';
  employeeForm!: FormGroup;
  saving = false;
  empIdFromQueryParams: number | null = null;
  loading = false;

  constructor(private router: Router, private route: ActivatedRoute, private dialog: MatDialog) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      const empIdParam = params.get('empId');
      if (empIdParam !== null) {
        this.empIdFromQueryParams = +empIdParam;
      } else {
        this.empIdFromQueryParams = null;
      }
    });
    this.getEmployees();
    this.employeeForm = new FormGroup({
      empName: new FormControl('', Validators.required),
      empEmail: new FormControl('', [Validators.required, Validators.email]),
      empPhone: new FormControl('', [
        Validators.required,
        Validators.pattern(/^(011|012|010)\d{8}$/),
      ]),
      empAddress: new FormControl('', Validators.required),
    });
  }

  getEmployees() {
    this.loading = true;
    axios
      .get('http://task.soft-zone.net/api/Employees/getAllEmployees')
      .then((response) => {
        this.employees = response.data;
        console.log('Fetched employees:', this.employees);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        this.loading = false;
      });
  }
  

  showAddPopup() {
    this.popupTitle = 'Add Employee';
    this.employeeForm.reset();
    this.showingPopup = true;
  }

  showEditPopup(employee: any) {
    this.popupTitle = 'Edit Employee';
    this.employeeForm.patchValue(employee);
    this.showingPopup = true;
  }

  closePopup() {
    this.showingPopup = false;
    this.router.navigate([], { queryParams: { empId: null } });
  }

  saveEmployee() {
    if (this.employeeForm.valid) {
      this.saving = true;
      const employeeData = this.employeeForm.value;
      const empIdFromQueryParams = this.route.snapshot.queryParamMap.get('empId');
      console.log(empIdFromQueryParams);
      if (empIdFromQueryParams) {
        // Call the editEmployee method for updating the existing employee
        this.editEmployee(employeeData);
        console.log("edit");
      } else {
        // Call the addEmployee method for creating a new employee
        this.addEmployee(employeeData);
        console.log("add");
      }
    }
    this.router.navigate([], { queryParams: { empId: null } });
  }

  addEmployee(employeeData: any) {
    axios
      .post('http://task.soft-zone.net/api/Employees/addEmployee', employeeData)
      .then(() => {
        this.getEmployees();
        this.showingPopup = false;
        this.saving = false;
      })
      .catch((error) => {
        console.error(error);
        this.saving = false;
      })
  }

  editEmployee(employeeData: any) {
    const { empName, empEmail, empPhone, empAddress } = employeeData;
  
    const requestBody = {
      empId: this.empIdFromQueryParams, // Use the empIdFromQueryParams received from the URL
      EmpName: empName,
      EmpEmail: empEmail,
      EmpPhone: empPhone,
      EmpAddress: empAddress,
    };
  
    axios
      .post('http://task.soft-zone.net/api/Employees/editEmployee', requestBody)
      .then(() => {
        this.getEmployees();
        this.showingPopup = false;
        this.saving = false;
        console.log("Editing employee");
      })
      .catch((error) => {
        console.error(error);
        this.saving = false;
        console.log("Error editing employee");
      });
  }
  

  deleteEmployee(empId: number) {
    axios
      .delete(`http://task.soft-zone.net/api/Employees/deleteEmployee/${empId}`)
      .then(() => {
        this.getEmployees();
      })
      .catch((error) => {
        console.error(error);
      });
  }
}
