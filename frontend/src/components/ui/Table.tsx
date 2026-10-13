import React, { useState, useCallback } from 'react';
import styles from './Table.module.css';

export type SortDirection = 'asc' | 'desc' | null;

export interface TableColumn<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string | number;
  onSort?: (key: string, direction: SortDirection) => void;
  sortKey?: string;
  sortDirection?: SortDirection;
  className?: string;
  caption?: string;
  emptyMessage?: React.ReactNode;
  isLoading?: boolean;
  stickyHeader?: boolean;
}

function SortIcon({ direction }: { direction: SortDirection }) {
  return (
    <span className={styles.sort__icon} aria-hidden="true">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8 3L8 13"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {direction !== 'desc' && (
          <path
            d="M5 6L8 3L11 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={direction === 'asc' ? '1' : '0.4'}
          />
        )}
        {direction !== 'asc' && (
          <path
            d="M5 10L8 13L11 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={direction === 'desc' ? '1' : '0.4'}
          />
        )}
      </svg>
    </span>
  );
}

function TableInner<T>(
  {
    columns,
    data,
    rowKey,
    onSort,
    sortKey: controlledSortKey,
    sortDirection: controlledSortDirection,
    className,
    caption,
    emptyMessage = 'No data available.',
    isLoading = false,
    stickyHeader = false,
  }: TableProps<T>,
  _ref: React.ForwardedRef<HTMLTableElement>
) {
  const isControlled =
    controlledSortKey !== undefined || controlledSortDirection !== undefined;

  const [internalSortKey, setInternalSortKey] = useState<string | null>(null);
  const [internalSortDirection, setInternalSortDirection] =
    useState<SortDirection>(null);

  const activeSortKey = isControlled ? controlledSortKey ?? null : internalSortKey;
  const activeSortDirection = isControlled
    ? controlledSortDirection ?? null
    : internalSortDirection;

  const handleSort = useCallback(
    (key: string) => {
      let nextDirection: SortDirection;
      if (activeSortKey !== key) {
        nextDirection = 'asc';
      } else if (activeSortDirection === 'asc') {
        nextDirection = 'desc';
      } else if (activeSortDirection === 'desc') {
        nextDirection = null;
      } else {
        nextDirection = 'asc';
      }

      if (!isControlled) {
        setInternalSortKey(nextDirection === null ? null : key);
        setInternalSortDirection(nextDirection);
      }

      onSort?.(key, nextDirection);
    },
    [activeSortKey, activeSortDirection, isControlled, onSort]
  );

  const wrapperClasses = [styles.table__wrapper, className ?? '']
    .filter(Boolean)
    .join(' ');

  const tableClasses = [
    styles.table,
    stickyHeader ? styles['table--sticky-header'] : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses} role="region" tabIndex={0}>
      <table
        ref={_ref}
        className={tableClasses}
        aria-busy={isLoading || undefined}
        aria-live="polite"
      >
        {caption && <caption className={styles.table__caption}>{caption}</caption>}
        <thead
          className={
            stickyHeader ? styles['table__thead--sticky'] : styles.table__thead
          }
        >
          <tr>
            {columns.map((col) => {
              const isSorted = activeSortKey === col.key;
              const ariaSortValue =
                isSorted && activeSortDirection === 'asc'
                  ? 'ascending'
                  : isSorted && activeSortDirection === 'desc'
                  ? 'descending'
                  : undefined;

              const thClasses = [
                styles.table__th,
                col.sortable ? styles['table__th--sortable'] : '',
                isSorted ? styles['table__th--sorted'] : '',
                col.align ? styles[`table__th--${col.align}`] : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <th
                  key={col.key}
                  className={thClasses}
                  style={col.width ? { width: col.width } : undefined}
                  aria-sort={ariaSortValue}
                  scope="col"
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      className={styles.sort__btn}
                      onClick={() => handleSort(col.key)}
                      aria-label={
                        typeof col.header === 'string'
                          ? `Sort by ${col.header}${
                              isSorted && activeSortDirection === 'asc'
                                ? ', sorted ascending'
                                : isSorted && activeSortDirection === 'desc'
                                ? ', sorted descending'
                                : ''
                            }`
                          : undefined
                      }
                    >
                      <span className={styles.sort__label}>{col.header}</span>
                      <SortIcon
                        direction={
                          isSorted ? activeSortDirection : null
                        }
                      />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className={styles.table__tbody}>
          {isLoading ? (
            <tr>
              <td
                colSpan={columns.length}
                className={styles['table__td--empty']}
              >
                <span className={styles.table__loading} aria-label="Loading">
                  <span className={styles.spinner} />
                </span>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className={styles['table__td--empty']}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={rowKey(row, index)} className={styles.table__tr}>
                {columns.map((col) => {
                  const tdClasses = [
                    styles.table__td,
                    col.align ? styles[`table__td--${col.align}`] : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <td key={col.key} className={tdClasses}>
                      {col.render
                        ? col.render(row, index)
                        : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const Table = React.forwardRef(TableInner) as <T>(
  props: TableProps<T> & { ref?: React.ForwardedRef<HTMLTableElement> }
) => React.ReactElement;

export default Table;
