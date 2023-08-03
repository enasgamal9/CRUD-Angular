import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EmployeeService } from '../employee.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-employee-grid',
  templateUrl: './employee-grid.component.html',
  styleUrls: ['./employee-grid.component.css']
})

export class EmployeeGridComponent {
  constructor(
    private router: Router,
    private employeeService: EmployeeService
  ) {}
  @Input() employees!: any[];
  @Output() delete = new EventEmitter<number>();
  @Output() edit = new EventEmitter<any>();
  @Output() deleteSelected = new EventEmitter<void>();

  currentPage = 1;
  itemsPerPage = 10;
  sortBy: string = '';
  sortAsc: boolean = true;

  get totalPages(): number {
    return Math.ceil(this.employees.length / this.itemsPerPage);
  }

  get displayedEmployees(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.employees.slice(startIndex, endIndex);
  }

  editEmployee(employee: any) {
    this.edit.emit(employee);
    this.router.navigate([], { queryParams: { empId: employee.empId } });
  }

  deleteEmployee(empId: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You are about to delete this employee. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.employeeService.deleteEmployee(empId).subscribe(
          () => {
            this.delete.emit(empId);
            Swal.fire('Deleted!', 'The employee has been deleted.', 'success');
          },
          (error) => {
            console.error(error);
            Swal.fire(
              'Error',
              'An error occurred while deleting the employee.',
              'error'
            );
          }
        );
      }
    });
  }

  selectedEmployees: number[] = [];

  toggleRowSelection(empId: number) {
    if (this.selectedEmployees.includes(empId)) {
      this.selectedEmployees = this.selectedEmployees.filter(
        (id) => id !== empId
      );
    } else {
      this.selectedEmployees.push(empId);
    }
  }

  areAllRowsSelected(): boolean {
    return this.displayedEmployees.every((employee) =>
      this.selectedEmployees.includes(employee.empId)
    );
  }

  onSelectAllRows(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.checked) {
      this.selectAllRows();
    } else {
      this.selectedEmployees = [];
    }
  }

  selectAllRows() {
    this.selectedEmployees = this.employees.map((employee) => employee.empId);
  }

  deleteSelectedEmployees() {
    if (this.selectedEmployees.length === 0) {
      // No employees selected
      Swal.fire('Warning', 'No employees selected.', 'warning');
      return;
    }
    Swal.fire({
      title: 'Are you sure?',
      text: 'You are about to delete selected employees. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete them!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const promises: Promise<any>[] = this.selectedEmployees.map((empId) =>
          this.employeeService.deleteEmployee(empId).toPromise()
        );
        Promise.all(promises)
          .then(() => {
            this.employees = this.employees.filter(
              (employee) => !this.selectedEmployees.includes(employee.empId)
            );
            this.selectedEmployees = [];
            this.goToPage(this.currentPage);
            Swal.fire(
              'Deleted!',
              'The selected employees have been deleted.',
              'success'
            );
          })
          .catch((error) => {
            console.error(error);
            Swal.fire(
              'Error',
              'An error occurred while deleting the employees.',
              'error'
            );
          });
      }
    });
  }

  sortByName() {
    this.sortAsc = this.sortBy === 'name' ? !this.sortAsc : true;
    this.sortBy = 'name';
    this.sortEmployees();
  }

  sortByAddress() {
    this.sortAsc = this.sortBy === 'address' ? !this.sortAsc : true;
    this.sortBy = 'address';
    this.sortEmployees();
  }

  sortEmployees() {
    this.employees.sort((a, b) => {
      if (this.sortBy === 'name') {
        return this.sortAsc
          ? a.empName.localeCompare(b.empName)
          : b.empName.localeCompare(a.empName);
      } else if (this.sortBy === 'address') {
        return this.sortAsc
          ? a.empAddress.localeCompare(b.empAddress)
          : b.empAddress.localeCompare(a.empAddress);
      }
      return 0;
    });
  }
  goToPage(pageNumber: number) {
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.currentPage = pageNumber;
    }
  }

  getPages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
}
