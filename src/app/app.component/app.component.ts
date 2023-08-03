import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { EmployeeGridComponent } from '../employee-grid.component/employee-grid.component';
import { EmployeeService } from '../employee.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
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
    private dialog: MatDialog,
    private employeeService: EmployeeService
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
    this.employeeService.getAllEmployees().subscribe(
      (response) => {
        this.employees = response;
        console.log('Fetched employees:', this.employees);
      },
      (error) => {
        console.error(error);
      }
    ).add(() => {
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

  addEmployee(employeeData: any) {
    this.employeeService.addEmployee(employeeData).subscribe(
      () => {
        this.getEmployees();
        this.showingPopup = false;
        this.saving = false;
      },
      (error) => {
        console.error(error);
        this.saving = false;
      }
    );
  }

  editEmployee(employeeData: any) {
    const { empName, empEmail, empPhone, empAddress } = employeeData;

    const requestBody = {
      empId: this.empIdFromQueryParams,
      EmpName: empName,
      EmpEmail: empEmail,
      EmpPhone: empPhone,
      EmpAddress: empAddress,
    };

    this.employeeService.editEmployee(requestBody).subscribe(
      () => {
        this.getEmployees();
        this.showingPopup = false;
        this.saving = false;
        console.log('Editing employee');
      },
      (error) => {
        console.error(error);
        this.saving = false;
        console.log('Error editing employee');
      }
    );
  }

  saveEmployee() {
    if (this.employeeForm.valid) {
      this.saving = true;
      const employeeData = this.employeeForm.value;
      const empIdFromQueryParams =
        this.route.snapshot.queryParamMap.get('empId');
      console.log(empIdFromQueryParams);
      if (empIdFromQueryParams) {
        this.editEmployee(employeeData);
        console.log('edit');
      } else {
        this.addEmployee(employeeData);
        console.log('add');
      }
    }
    this.router.navigate([], { queryParams: { empId: null } });
  }

  deleteEmployee(empId: number) {
    this.employeeService.deleteEmployee(empId).subscribe(
      () => {
        this.getEmployees();
      },
      (error) => {
        console.error(error);
      }
    );
  }

  onDeleteSelected() {
    this.employeeGridComponent.deleteSelectedEmployees();
  }
}
