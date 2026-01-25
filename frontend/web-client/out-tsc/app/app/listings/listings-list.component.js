var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListingsApiService } from './listings-api.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { RouterModule } from '@angular/router';
let ListingsListComponent = class ListingsListComponent {
    api = inject(ListingsApiService);
    dialog = inject(MatDialog);
    dataSource = new MatTableDataSource([]);
    displayedColumns = ['title', 'make', 'model', 'generation', 'derivative', 'variant', 'body', 'transmission', 'fuel', 'price', 'actions'];
    loading = true;
    paginator;
    sort;
    ngOnInit() {
        this.api.getListings().subscribe({
            next: x => { this.dataSource.data = x; this.loading = false; this.attachTableFeatures(); },
            error: _ => { this.loading = false; }
        });
    }
    attachTableFeatures() {
        if (this.paginator)
            this.dataSource.paginator = this.paginator;
        if (this.sort)
            this.dataSource.sort = this.sort;
    }
    onDelete(l) {
        const ref = this.dialog.open(ConfirmDialogComponent, { data: { message: `Delete listing '${l.title}'?` } });
        ref.afterClosed().subscribe(confirmed => {
            if (!confirmed)
                return;
            this.api.deleteListing(l.id).subscribe({ next: () => { this.dataSource.data = this.dataSource.data.filter(x => x.id !== l.id); }, error: () => { } });
        });
    }
};
__decorate([
    ViewChild(MatPaginator),
    __metadata("design:type", MatPaginator)
], ListingsListComponent.prototype, "paginator", void 0);
__decorate([
    ViewChild(MatSort),
    __metadata("design:type", MatSort)
], ListingsListComponent.prototype, "sort", void 0);
ListingsListComponent = __decorate([
    Component({
        selector: 'app-listings-list',
        standalone: true,
        imports: [CommonModule, MatTableModule, MatPaginatorModule, MatSortModule, MatProgressBarModule, MatIconModule, MatDialogModule, MatButtonModule, ConfirmDialogComponent, RouterModule],
        templateUrl: './listings-list.component.html'
    })
], ListingsListComponent);
export { ListingsListComponent };
//# sourceMappingURL=listings-list.component.js.map