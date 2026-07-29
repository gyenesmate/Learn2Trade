import { Component, input, effect, OnInit, ViewChild, AfterViewInit, HostListener, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TableColumn, TableAction, RowAction } from './data-table-utilities';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DatePipe,
    CurrencyPipe
  ],
  providers: [DatePipe, CurrencyPipe],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent<T> implements OnInit, AfterViewInit {
  // Inputs as signals
  readonly columns = input<TableColumn<T>[]>([]);
  readonly title = input<string | undefined>(undefined);
  readonly data = input<T[]>([]);
  readonly actionBar = input<TableAction[]>([]);
  readonly rowActions = input<RowAction<T>[]>([]);

  public innerWidth = signal<number>(window.innerWidth);
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.innerWidth.set(event.target.innerWidth);
  }

  dataSource = new MatTableDataSource<T>([]);
  displayedColumns: string[] = [];
  expandedRow = signal<T | null>(null);

  @ViewChild(MatPaginator)
  set paginator(value: MatPaginator) {
    if (value) {
      this.dataSource.paginator = value;
    }
  }

  @ViewChild(MatSort)
  set sort(value: MatSort) {
    if (value) {
      this.dataSource.sort = value;
    }
  }

  constructor(private datePipe: DatePipe, private currencyPipe: CurrencyPipe) {
    // React to columns or rowActions changes
    effect(() => {
      const cols = this.columns();
      const innerWidth = this.innerWidth();

      if (innerWidth < 600) {
        this.displayedColumns = this.columns()[0] ? [String(this.columns()[0].key)] : [];
        if (!this.displayedColumns.includes('expand')) {
          this.displayedColumns.push('expand');
        }
        if (this.rowActions() && this.rowActions().length > 0) {
          if (!this.displayedColumns.includes('actions')) {
            this.displayedColumns.push('actions');
          }
        }
      } else {
        this.displayedColumns = cols.map(col => String(col.key));
        this.displayedColumns = this.displayedColumns.filter(c => c !== 'expand');
        if (this.rowActions() && this.rowActions().length > 0) {
          if (!this.displayedColumns.includes('actions')) {
            this.displayedColumns.push('actions');
          }
        } else {
          this.displayedColumns = this.displayedColumns.filter(c => c !== 'actions');
        }
      }
    });

    // React to data changes and update dataSource
    effect(() => {
      this.dataSource.data = this.data();
    });

    // When paginator becomes available, attach paginator and sort to dataSource
    effect(() => {
      const p = this.paginator;
      if (p) {
        this.dataSource.paginator = p;
        // assign sort if available (may be undefined)
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }
      }
    });
  }

  ngOnInit() {

  }

  ngAfterViewInit() {}

  isMobile(): boolean {
    return this.innerWidth() < 600;
  }

  onRowContext(event: MouseEvent, tooltip: { show: () => void; hide: () => void; }) {
    event.preventDefault();
    if (this.isMobile()) return;
    try {
      tooltip.show();
      setTimeout(() => tooltip.hide(), 3500);
    } catch (e) {
      // ignore
    }
  }

  formatRowTooltip(row: any) {
    if (!row || this.innerWidth() > 600) return '';
    // display a compact summary: first two keys
    try {
      const keys = Object.keys(row);
      const parts = keys.slice(0, 2).map(k => `${k}: ${row[k]}`);
      return parts.join(' — ');
    } catch {
      return String(row);
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  toggleRow(row: T) {
    const current = this.expandedRow();
    this.expandedRow.set(current === row ? null : row);
  }

  isExpanded(row: T): boolean {
    return this.expandedRow() === row;
  }

  isExpandedRow = (_index: number, row: T): boolean => this.isExpanded(row);

  formatCell(row: any, column: TableColumn<T>): string {
    if (!row || !column) return '';
    const value = row[column.key as keyof typeof row];
    switch (column.type) {
      case 'date':
        return this.datePipe.transform(value, 'short') ?? '';
      case 'currency':
        return this.currencyPipe.transform(value) ?? '';
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return value !== undefined && value !== null ? String(value) : '';
    }
  }
}
