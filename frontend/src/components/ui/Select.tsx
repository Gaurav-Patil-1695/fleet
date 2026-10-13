import React, { forwardRef } from 'react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  id?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>((
  {
    label,
    error,
    hint,
    id,
    options,
    placeholder,
    className,
    containerClassName,
    disabled,
    ...rest
  },
  ref
) => {
  const selectClasses = [
    styles.select,
    error ? styles['select--error'] : '',
    disabled ? styles['select--disabled'] : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const containerClasses = [
    styles.field,
    containerClassName ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const selectId =
    id ?? (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={selectId} className={styles.field__label}>
          {label}
        </label>
      )}
      <div className={styles.select__wrapper}>
        <select
          ref={ref}
          id={selectId}
          className={selectClasses}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error
              ? `${selectId}-error`
              : hint
              ? `${selectId}-hint`
              : undefined
          }
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className={styles.select__chevron} aria-hidden="true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      {error && (
        <span
          id={`${selectId}-error`}
          className={styles.field__error}
          role="alert"
        >
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${selectId}-hint`} className={styles.field__hint}>
          {hint}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
