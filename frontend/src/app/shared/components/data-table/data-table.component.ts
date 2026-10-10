import {
  Component,
  input,
  output,
  effect,
  HostListener,
  signal,
  ChangeDetectionStrategy,
  inject,
  viewChild,
  computed,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';
import { formatDecimal, formatMoney, toNumber } from '@core/utils/number.util';
import { TABLE_COMPACT_MAX_PX } from '@core/layout/layout-breakpoints';
import { TableColumn, TableAction, RowAction } from './data-table.types';

@Component({
  selector: 'app-data-table',
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    DatePipe,
    TranslatePipe,
  ],
  providers: [DatePipe],
  templateUrl: './data-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T> {
  private readonly datePipe = inject(DatePipe);

  readonly columns = input<TableColumn<T>[]>([]);
  readonly title = input<string | undefined>(undefined);
  readonly data = input<T[]>([]);
  readonly actionBar = input<TableAction[]>([]);
  readonly rowActions = input<RowAction<T>[]>([]);
  readonly multiSelect = input(false);
  readonly loading = input(false);
  /** Escape hatch when the domain id field is not named `id`. */
  readonly rowId = input<(row: T) => string>((row) =>
    String((row as { id?: unknown }).id ?? '')
  );
  readonly selectionChange = output<T[]>();

  readonly innerWidth = signal<number>(window.innerWidth);
  readonly expandedRow = signal<T | null>(null);
  /** Per-column text filter values. Other filter types will be added later. */
  readonly columnFilters = signal<Record<string, string>>({});
  private readonly selectedIds = signal<Set<string>>(new Set());

  private readonly paginator = viewChild(MatPaginator);
  private readonly sort = viewChild(MatSort);

  dataSource = new MatTableDataSource<T>([]);

  readonly displayedColumns = computed(() => {
    const cols = this.columns().filter((c) => c.key !== 'id');
    const actions = this.rowActions();
    const select = this.multiSelect() ? (['select'] as string[]) : [];

    if (this.innerWidth() < TABLE_COMPACT_MAX_PX) {
      const result: string[] = [...select];
      if (cols[0]) result.push(String(cols[0].key));
      if (!result.includes('expand')) result.push('expand');
      if (actions?.length && !result.includes('actions')) result.push('actions');
      return result;
    }

    const result = [...select, ...cols.map((col) => String(col.key)).filter((c) => c !== 'expand')];
    if (actions?.length && !result.includes('actions')) {
      result.push('actions');
    }
    return result;
  });

  /** Second header row column defs (filter__*). */
  readonly filterRowColumns = computed(() =>
    this.displayedColumns().map((key) => `filter__${key}`)
  );

  readonly hasFilterRow = computed(
    () => this.multiSelect() || this.columns().some((c) => c.filterable === true)
  );

  readonly isMobile = computed(() => this.innerWidth() < TABLE_COMPACT_MAX_PX);

  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent): void {
    const target = event.target as Window;
    this.innerWidth.set(target.innerWidth);
  }

  constructor() {
    this.dataSource.filterPredicate = (row: T, filter: string) => {
      let filters: Record<string, string> = {};
      try {
        filters = JSON.parse(filter) as Record<string, string>;
      } catch {
        return true;
      }
      return Object.entries(filters).every(([key, raw]) => {
        const q = raw.trim().toLowerCase();
        if (!q) return true;
        const value = (row as Record<string, unknown>)[key];
        return String(value ?? '')
          .toLowerCase()
          .includes(q);
      });
    };

    effect(() => {
      this.dataSource.data = this.data();
    });

    effect(() => {
      const p = this.paginator();
      const s = this.sort();
      if (p) this.dataSource.paginator = p;
      if (s) this.dataSource.sort = s;
    });

    effect(() => {
      // Re-apply column filters whenever the map changes.
      this.dataSource.filter = JSON.stringify(this.columnFilters());
    });
  }

  resolveRowId(row: T): string {
    return this.rowId()(row);
  }

  isSelected(row: T): boolean {
    return this.selectedIds().has(this.resolveRowId(row));
  }

  toggleRowSelection(row: T, checked: boolean): void {
    const id = this.resolveRowId(row);
    if (!id) return;
    const next = new Set(this.selectedIds());
    if (checked) next.add(id);
    else next.delete(id);
    this.selectedIds.set(next);
    this.emitSelection();
  }

  isPageAllSelected(): boolean {
    const page = this.pageRows();
    return page.length > 0 && page.every((row) => this.isSelected(row));
  }

  isPagePartiallySelected(): boolean {
    const page = this.pageRows();
    const selectedCount = page.filter((row) => this.isSelected(row)).length;
    return selectedCount > 0 && selectedCount < page.length;
  }

  togglePageSelection(checked: boolean): void {
    const next = new Set(this.selectedIds());
    for (const row of this.pageRows()) {
      const id = this.resolveRowId(row);
      if (!id) continue;
      if (checked) next.add(id);
      else next.delete(id);
    }
    this.selectedIds.set(next);
    this.emitSelection();
  }

  setColumnFilter(key: string, value: string): void {
    this.columnFilters.update((current) => ({ ...current, [key]: value }));
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
    if (!row || this.innerWidth() > TABLE_COMPACT_MAX_PX) return '';
    try {
      const keys = Object.keys(row).filter((k) => k !== 'id');
      const parts = keys.slice(0, 2).map((k) => `${k}: ${row[k]}`);
      return parts.join(' — ');
    } catch {
      return String(row);
    }
  }

  toggleRow(row: T): void {
    const current = this.expandedRow();
    this.expandedRow.set(current === row ? null : row);
  }

  isExpanded(row: T): boolean {
    return this.expandedRow() === row;
  }

  rowSelectIdentity(row: T): string {
    const record = row as Record<string, unknown>;
    const label =
      record['symbol'] ?? record['name'] ?? record['type'] ?? this.resolveRowId(row) ?? 'row';
    return String(label);
  }

  formatCell(row: Record<string, unknown>, column: TableColumn<T>): string {
    if (!row || !column) return '';
    const value = row[column.key as string];
    switch (column.type) {
      case 'date':
        return this.datePipe.transform(value as string | number | Date, 'short') ?? '';
      case 'currency':
        return formatMoney(toNumber(value));
      case 'number':
        return formatDecimal(toNumber(value));
      case 'boolean':
        return value ? 'COMMON.YES' : 'COMMON.NO';
      default:
        return value !== undefined && value !== null ? String(value) : '';
    }
  }

  private pageRows(): T[] {
    if (!this.dataSource.paginator) {
      return this.dataSource.filteredData;
    }
    const start = this.dataSource.paginator.pageIndex * this.dataSource.paginator.pageSize;
    const end = start + this.dataSource.paginator.pageSize;
    return this.dataSource.filteredData.slice(start, end);
  }

  private emitSelection(): void {
    const ids = this.selectedIds();
    const selected = this.data().filter((row) => ids.has(this.resolveRowId(row)));
    this.selectionChange.emit(selected);
  }
}
