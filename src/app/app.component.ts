import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { EmployeeGridComponent } from './employee-grid.component';
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
    <div class="tableHeader container">
      <h3 class="table-title">Manage Employees</h3>
      <button class="btn btn-success p-2" (click)="showAddPopup()">
        <i class="fas fa-plus bg-white text-success rounded-5 p-1"></i> Add New
        Employee
      </button>
      <button class="btn btn-danger mx-3 p-2" (click)="onDeleteSelected()">
        <i class="fas fa-minus bg-white text-danger rounded-5 p-1"></i> Delete
        Selected Employees
      </button>
    </div>
    <app-employee-grid
      #employeeGridComponent
      [employees]="employees"
      (delete)="deleteEmployee($event)"
      (edit)="showEditPopup($event)"
      (deleteSelected)="onDeleteSelected()"
    ></app-employee-grid>
    <div class="overlay" *ngIf="showingPopup">
      <div class="popup">
        <h2>{{ popupTitle }}</h2>
        <form [formGroup]="employeeForm">
          <label>Name:</label>
          <input type="text" formControlName="empName" />
          <div
            *ngIf="
              employeeForm.get('empName')!.invalid &&
              employeeForm.get('empName')!.touched
            "
          >
            <div *ngIf="employeeForm.get('empName')!.hasError('required')" class="text-danger">
              Name is required.
            </div>
          </div>

          <label>Email:</label>
          <input type="email" formControlName="empEmail" />
          <div
            *ngIf="
              employeeForm.get('empEmail')!.invalid &&
              employeeForm.get('empEmail')!.touched
            "
          >
            <div *ngIf="employeeForm.get('empEmail')!.hasError('required')" class="text-danger">
              Email is required.
            </div>
            <div *ngIf="employeeForm.get('empEmail')!.hasError('email')" class="text-danger">
              Invalid Email format.
            </div>
          </div>

          <label>Mobile:</label>
          <input type="text" formControlName="empPhone" />
          <div
            *ngIf="
              employeeForm.get('empPhone')!.invalid &&
              employeeForm.get('empPhone')!.touched
            "
          >
            <div *ngIf="employeeForm.get('empPhone')!.hasError('required')" class="text-danger">
              Mobile is required.
            </div>
            <div *ngIf="employeeForm.get('empPhone')!.hasError('pattern')" class="text-danger">
              Invalid mobile format.
            </div>
          </div>

          <label>Address:</label>
          <input type="text" formControlName="empAddress" />
          <div
            *ngIf="
              employeeForm.get('empAddress')!.invalid &&
              employeeForm.get('empAddress')!.touched
            "
          >
            <div *ngIf="employeeForm.get('empAddress')!.hasError('required')" class="text-danger">
              Address is required.
            </div>
          </div>

          <button
            class="btn btn-success mx-2 w-25"
            type="button"
            (click)="saveEmployee()"
            [disabled]="employeeForm.invalid || saving"
          >
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
          <button type="button" class="btn btn-danger w-25" (click)="closePopup()">
            Cancel
          </button>
        </form>
      </div>
    </div>
    <app-loader *ngIf="loading"></app-loader>
  `,
  styles: [
    `
      .tableHeader {
        margin-top: 20px;
        padding: 20px;
        background-color: #435d7d;
      }
      .table-title {
        color: white;
        display: inline-block;
        margin-right: 35%;
      }
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
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* Adding a subtle shadow effect */
        max-width: 400px; /* Adjust this value to change the maximum width of the popup */
      }

      .popup label {
        margin-bottom: 8px;
        font-weight: bold;
      }

      .popup input {
        width: 100%;
        padding: 8px;
        margin-bottom: 16px;
        border: 1px solid #ccc;
        border-radius: 4px;
      }

      .popup button {
        padding: 8px 16px;
        margin-top: 16px;
        border: none;
        border-radius: 4px;
        color: #fff;
        cursor: pointer;
      }

      .popup button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }
      @media (max-width: 768px) {
        .tableHeader {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  @ViewChild('employeeGridComponent')
  employeeGridComponent!: EmployeeGridComponent;

  employees: any[] = [];
  showingPopup = false;
  popupTitle = '';
  employeeForm!: FormGroup;
  saving = false;
  empIdFromQueryParams: number | null = null;
  loading = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog
  ) {}

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
      const empIdFromQueryParams =
        this.route.snapshot.queryParamMap.get('empId');
      console.log(empIdFromQueryParams);
      if (empIdFromQueryParams) {
        // Call the editEmployee method for updating the existing employee
        this.editEmployee(employeeData);
        console.log('edit');
      } else {
        // Call the addEmployee method for creating a new employee
        this.addEmployee(employeeData);
        console.log('add');
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
      });
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
        console.log('Editing employee');
      })
      .catch((error) => {
        console.error(error);
        this.saving = false;
        console.log('Error editing employee');
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

  onDeleteSelected() {
    this.employeeGridComponent.deleteSelectedEmployees();
  }
}
