import { Component, EventEmitter, Input, Output } from '@angular/core';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Router } from '@angular/router'; // Add this line

@Component({
  selector: 'app-employee-grid',
  template: `
  <table *ngIf="employees && employees.length > 0">

      <thead>
        <tr>
        <th>
        <input type="checkbox" [checked]="areAllRowsSelected()" (change)="onSelectAllRows($event)" />
        </th>
        <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Mobile</th>
          <th>Address</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let employee of displayedEmployees">
        <td>
        <input type="checkbox" [checked]="selectedEmployees.includes(employee.empId)" (change)="toggleRowSelection(employee.empId)" />
      </td>
        <td>{{ employee.empId }}</td>
          <td>{{ employee.empName }}</td>
          <td>{{ employee.empEmail }}</td>
          <td>{{ employee.empPhone }}</td>
          <td>{{ employee.empAddress }}</td>
          <td>
            <button (click)="editEmployee(employee)"><i class="fas fa-edit"></i></button>
            <button (click)="deleteEmployee(employee.empId)"><i class="fas fa-trash"></i></button>
          </td>
        </tr>
      </tbody>
    </table>
    <div>
  <button (click)="deleteSelectedEmployees()">Delete Selected</button>
</div>

    <div *ngIf="totalPages > 1" class="pagination">
      <button [disabled]="currentPage === 1" (click)="goToPage(1)">First</button>
      <button [disabled]="currentPage === 1" (click)="goToPage(currentPage - 1)">Previous</button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button [disabled]="currentPage === totalPages" (click)="goToPage(currentPage + 1)">Next</button>
      <button [disabled]="currentPage === totalPages" (click)="goToPage(totalPages)">Last</button>
    </div>
  `,
  styles: [`
  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 8px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  th {
    background-color: #f2f2f2;
  }

  button {
    padding: 5px 10px;
    margin-right: 5px;
    border: none;
    cursor: pointer;
  }

  .edit-btn {
    background-color: #28a745;
    color: #fff;
  }

  .delete-btn {
    background-color: #dc3545;
    color: #fff;
  }

    .pagination {
      margin-top: 10px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .pagination button {
      margin: 0 5px;
      padding: 5px 10px;
      border: none;
      cursor: pointer;
    }
  `]
})
export class EmployeeGridComponent {
  constructor(private router: Router) {}
  @Input() employees!: any[];
  @Output() delete = new EventEmitter<number>();
  @Output() edit = new EventEmitter<any>();

  currentPage = 1;
  itemsPerPage = 10;

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
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        // User confirmed, proceed with deletion
        axios
          .get(`http://task.soft-zone.net/api/Employees/deleteEmpByID/${empId}`)
          .then(() => {
            // Notify parent component that the employee is deleted
            this.delete.emit(empId);
            Swal.fire('Deleted!', 'The employee has been deleted.', 'success');
          })
          .catch((error) => {
            console.error(error);
            Swal.fire('Error', 'An error occurred while deleting the employee.', 'error');
          });
      }
    });
  }
  selectedEmployees: number[] = [];

  toggleRowSelection(empId: number) {
    if (this.selectedEmployees.includes(empId)) {
      this.selectedEmployees = this.selectedEmployees.filter((id) => id !== empId);
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
      // No employees selected, show an alert
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
        // User confirmed, proceed with deletion
        const promises: Promise<any>[] = this.selectedEmployees.map((empId) =>
          axios.get(`http://task.soft-zone.net/api/Employees/deleteEmpByID/${empId}`)
        );

        Promise.all(promises)
          .then(() => {
            // Notify parent component that the employees are deleted
            //this.delete.emit(this.selectedEmployees);
            Swal.fire('Deleted!', 'The selected employees have been deleted.', 'success');
            this.selectedEmployees = [];
          })
          .catch((error) => {
            console.error(error);
            Swal.fire('Error', 'An error occurred while deleting the employees.', 'error');
          });
      }
    });
  }
  

  goToPage(pageNumber: number) {
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.currentPage = pageNumber;
    }
  }
}
