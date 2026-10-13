import React, { useEffect, useState } from 'react';
import Select from '../ui/Select';
import type { User } from '../../types/auth';
import { extractErrorMessage } from '../../utils/errorUtils';
import styles from './AssignTechnicianField.module.css';

interface AssignTechnicianFieldProps {
  value: string;
  onChange: (userId: string) => void;
  depotId?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

const AssignTechnicianField: React.FC<AssignTechnicianFieldProps> = ({
  value,
  onChange,
  disabled = false,
  error,
  required = false,
}) => {
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchTechnicians = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        // Dynamically import to avoid circular dependencies and respect module map
        const { default: apiClient } = await import('../../services/apiClient');
        const response = await apiClient.get<{ items: User[] }>('/users', {
          params: { role: 'technician', limit: 200 },
        });
        if (!cancelled) {
          // Support both paginated and array responses
          const items = Array.isArray(response.data)
            ? (response.data as User[])
            : (response.data as { items: User[] }).items ?? [];
          setTechnicians(items);
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(extractErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchTechnicians();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const fieldId = 'assign-technician-field';
  const errorId = 'assign-technician-error';
  const fetchErrorId = 'assign-technician-fetch-error';

  return (
    <div className={styles.wrapper}>
      <label htmlFor={fieldId} className={styles.label}>
        Assigned Technician
        {required && (
          <span className={styles.required} aria-hidden="true">
            {' '}*
          </span>
        )}
      </label>

      {fetchError && (
        <span id={fetchErrorId} className={styles.fetchError} role="alert">
          Failed to load technicians: {fetchError}
        </span>
      )}

      <Select
        id={fieldId}
        value={value}
        onChange={handleChange}
        disabled={disabled || loading}
        aria-required={required}
        aria-describedby={
          [
            error ? errorId : null,
            fetchError ? fetchErrorId : null,
          ]
            .filter(Boolean)
            .join(' ') || undefined
        }
        className={[
          error ? styles.selectError : '',
          loading ? styles.loading : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <option value="">
          {loading ? 'Loading technicians…' : '— Select technician —'}
        </option>
        {technicians.map((tech) => (
          <option key={tech.id} value={tech.id}>
            {tech.full_name}
          </option>
        ))}
      </Select>

      {error && (
        <span id={errorId} className={styles.errorText} role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default AssignTechnicianField;
