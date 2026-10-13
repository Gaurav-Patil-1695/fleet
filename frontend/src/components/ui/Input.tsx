import React, { forwardRef } from 'react';
import styles from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  id?: string;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>((
  {
    label,
    error,
    hint,
    id,
    className,
    containerClassName,
    disabled,
    ...rest
  },
  ref
) => {
  const inputClasses = [
    styles.input,
    error ? styles['input--error'] : '',
    disabled ? styles['input--disabled'] : '',
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

  const inputId = id ?? (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className={styles.field__label}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={inputClasses}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error
            ? `${inputId}-error`
            : hint
            ? `${inputId}-hint`
            : undefined
        }
        {...rest}
      />
      {error && (
        <span
          id={`${inputId}-error`}
          className={styles.field__error}
          role="alert"
        >
          {error}
        </span>
      )}
      {!error && hint && (
        <span id={`${inputId}-hint`} className={styles.field__hint}>
          {hint}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
