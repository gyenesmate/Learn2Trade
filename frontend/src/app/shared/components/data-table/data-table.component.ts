import {
  Component,
  input,
  effect,
  HostListener,
  signal,
  ChangeDetectionStrategy,
  inject,
  viewChild,
  computed,
} from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TableColumn, TableAction, RowAction } from './data-table-utilities';

@Component({
  selector: 'app-data-table',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DatePipe,
    CurrencyPipe,
  ],
  providers: [DatePipe, CurrencyPipe],
  templateUrl: './data-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T> {
  private readonly datePipe = inject(DatePipe);
  private readonly currencyPipe = inject(CurrencyPipe);

  readonly columns = input<TableColumn<T>[]>([]);
  readonly title = input<string | undefined>(undefined);
  readonly data = input<T[]>([]);
  readonly actionBar = input<TableAction[]>([]);
  readonly rowActions = input<RowAction<T>[]>([]);

  readonly innerWidth = signal<number>(window.innerWidth);
  readonly expandedRow = signal<T | null>(null);

  private readonly paginator = viewChild(MatPaginator);
  private readonly sort = viewChild(MatSort);

  dataSource = new MatTableDataSource<T>([]);

  readonly displayedColumns = computed(() => {
    const cols = this.columns();
    const actions = this.rowActions();
    if (this.innerWidth() < 600) {
      const result: string[] = cols[0] ? [String(cols[0].key)] : [];
      if (!result.includes('expand')) result.push('expand');
      if (actions?.length && !result.includes('actions')) result.push('actions');
      return result;
    }
    const result = cols.map((col) => String(col.key)).filter((c) => c !== 'expand');
    if (actions?.length) {
      if (!result.includes('actions')) result.push('actions');
    }
    return result.filter((c) => c !== 'actions' || !!actions?.length);
  });

  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent): void {
    const target = event.target as Window;
    this.innerWidth.set(target.innerWidth);
  }

  constructor() {
    effect(() => {
      this.dataSource.data = this.data();
    });

    effect(() => {
      const p = this.paginator();
      const s = this.sort();
      if (p) this.dataSource.paginator = p;
      if (s) this.dataSource.sort = s;
    });
  }

  isMobile(): boolean {
    return this.innerWidth() < 600;
  }

  onRowContext(event: MouseEvent, tooltip: { show: () => void; hide: () => void }): void {
    event.preventDefault();
    if (this.isMobile()) return;
    try {
      tooltip.show();
      setTimeout(() => tooltip.hide(), 3500);
    } catch {
      // ignore
    }
  }

  formatRowTooltip(row: Record<string, unknown>): string {
    if (!row || this.innerWidth() > 600) return '';
    try {
      const keys = Object.keys(row);
      const parts = keys.slice(0, 2).map((k) => `${k}: ${row[k]}`);
      return parts.join(' — ');
    } catch {
      return String(row);
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  toggleRow(row: T): void {
    const current = this.expandedRow();
    this.expandedRow.set(current === row ? null : row);
  }

  isExpanded(row: T): boolean {
    return this.expandedRow() === row;
  }

  isExpandedRow = (_index: number, row: T): boolean => this.isExpanded(row);

  formatCell(row: Record<string, unknown>, column: TableColumn<T>): string {
    if (!row || !column) return '';
    const value = row[column.key as string];
    switch (column.type) {
      case 'date':
        return this.datePipe.transform(value as string | number | Date, 'short') ?? '';
      case 'currency':
        return this.currencyPipe.transform(value as number) ?? '';
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return value !== undefined && value !== null ? String(value) : '';
    }
  }
}
