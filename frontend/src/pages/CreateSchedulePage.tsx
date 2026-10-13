import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicleTypes } from '../hooks/useVehicles';
import { createSchedule } from '../services/schedulesService';
import { listVehicleTypes } from '../services/vehicleTypesService';
import { parseError } from '../utils/errorUtils';
import { RoleGuard } from '../components/layout/RoleGuard';
import type { VehicleType } from '../types/vehicleType';
import styles from './CreateSchedulePage.module.css';

interface FormState {
  vehicle_type_id: string;
  vehicle_class: string;
  km_interval: string;
  month_interval: string;
  is_active: boolean;
}

interface FieldErrors {
  vehicle_type_id?: string;
  vehicle_class?: string;
  km_interval?: string;
  month_interval?: string;
}

const VEHICLE_CLASS_LABELS: Record<string, string> = {
  heavy_truck: 'Heavy Truck',
  light_commercial: 'Light Commercial',
  other: 'Other',
};

const CreateSchedulePage: React.FC = () => {
  const navigate = useNavigate();

  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [typesError, setTypesError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    vehicle_type_id: '',
    vehicle_class: '',
    km_interval: '',
    month_interval: '',
    is_active: true,
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchVehicleTypes = async () => {
    setTypesLoading(true);
    setTypesError(null);
    try {
      const response = await listVehicleTypes({ page: 1, pageSize: 200 });
      setVehicleTypes(response.data);
    } catch (err: unknown) {
      const parsed = parseError(err);
      setTypesError(parsed.message ?? 'Could not load vehicle types');
    } finally {
      setTypesLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicleTypes();
  }, []);

  const handleVehicleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const selectedType = vehicleTypes.find((vt) => vt.id === id);
    setForm((prev) => ({
      ...prev,
      vehicle_type_id: id,
      vehicle_class: selectedType ? selectedType.vehicle_class : '',
    }));
    setFieldErrors((prev) => ({ ...prev, vehicle_type_id: undefined, vehicle_class: undefined }));
  };

  const handleKmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, km_interval: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, km_interval: undefined }));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, month_interval: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, month_interval: undefined }));
  };

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, is_active: e.target.checked }));
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (!form.vehicle_type_id) {
      errors.vehicle_type_id = 'Vehicle type ID must be a valid UUID.';
    } else {
      const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!uuidPattern.test(form.vehicle_type_id)) {
        errors.vehicle_type_id = 'Vehicle type ID must be a valid UUID.';
      }
    }

    if (!form.vehicle_class) {
      errors.vehicle_class = 'Vehicle class is required and must not exceed 50 characters.';
    } else if (form.vehicle_class.length > 50) {
      errors.vehicle_class = 'Vehicle class is required and must not exceed 50 characters.';
    }

    const kmVal = parseInt(form.km_interval, 10);
    if (!form.km_interval || isNaN(kmVal) || kmVal < 1) {
      errors.km_interval = 'Kilometre interval is required and must be a positive whole number.';
    }

    const monthVal = parseInt(form.month_interval, 10);
    if (!form.month_interval || isNaN(monthVal) || monthVal < 1) {
      errors.month_interval = 'Month interval is required and must be a positive whole number.';
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await createSchedule({
        vehicle_type_id: form.vehicle_type_id,
        vehicle_class: form.vehicle_class,
        km_interval: parseInt(form.km_interval, 10),
        month_interval: parseInt(form.month_interval, 10),
        is_active: form.is_active,
      });
      navigate('/schedules');
    } catch (err: unknown) {
      const parsed = parseError(err);
      setSubmitError(parsed.message ?? 'Failed to save schedule — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSaveDisabled = submitting || (typesError !== null && vehicleTypes.length === 0);

  const selectedType = vehicleTypes.find((vt) => vt.id === form.vehicle_type_id);
  const vehicleClassDisplay = selectedType
    ? (VEHICLE_CLASS_LABELS[selectedType.vehicle_class] ?? selectedType.vehicle_class)
    : null;

  return (
    <RoleGuard roles={['administrator']}>
      <div
        style={{
          maxWidth: 'var(--content-narrow-width)',
          fontFamily: 'var(--font-family-base)',
        }}
      >
        <h1
          style={{
            fontSize: 'var(--font-size-h1)',
            fontWeight: 'var(--font-weight-h1)',
            lineHeight: 'var(--font-line-height-h1)',
            color: 'var(--color-body)',
            marginBottom: 'var(--space-6)',
          }}
        >
          New Service Schedule
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Breadcrumb */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--font-size-small)',
              color: 'var(--color-muted)',
            }}
            aria-label="Breadcrumb"
          >
            <button
              type="button"
              onClick={() => navigate('/schedules')}
              style={{
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontWeight: 'var(--font-weight-medium)',
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: 'var(--font-size-small)',
                fontFamily: 'var(--font-family-base)',
              }}
            >
              Schedules
            </button>
            <span aria-hidden="true">›</span>
            <span style={{ color: 'var(--color-muted)' }}>New schedule</span>
          </nav>

          {/* Submit error banner */}
          {submitError && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-3)',
                padding: 'var(--space-4) var(--space-5)',
                background: 'var(--color-error)',
                color: 'var(--color-on-error)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-small)',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ flexShrink: 0, marginTop: '2px' }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{submitError}</span>
            </div>
          )}

          {/* Form card */}
          <div
            style={{
              background: 'var(--color-surface)',
              boxShadow: 'var(--elevation-1)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-8)',
            }}
          >
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                {/* Section header */}
                <div
                  style={{
                    borderBottom: '1px solid var(--color-border-subtle)',
                    paddingBottom: 'var(--space-4)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <p
                    style={{
                      margin: '0 0 var(--space-1) 0',
                      fontSize: 'var(--font-size-caption)',
                      fontWeight: 'var(--font-weight-semibold)',
                      letterSpacing: 'var(--font-letter-spacing-caps)',
                      color: 'var(--color-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Schedule details
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--font-size-small)',
                      color: 'var(--color-muted)',
                      margin: 0,
                    }}
                  >
                    Define the service interval for a specific vehicle type. Both a kilometre and a
                    month threshold must be provided — whichever is reached first triggers a service
                    alert.
                  </p>
                </div>

                {/* Vehicle Type */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label
                    htmlFor="create-schedule-vehicle_type_id"
                    style={{
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-body)',
                      fontSize: 'var(--font-size-body)',
                    }}
                  >
                    Vehicle type
                    <span
                      style={{ color: 'var(--color-error)', marginLeft: 'var(--space-1)' }}
                      aria-hidden="true"
                    >
                      *
                    </span>
                  </label>

                  {typesLoading ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        padding: '0 var(--space-3)',
                        height: 'var(--touch-target-min)',
                        border: '1px solid var(--color-border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-canvas)',
                        color: 'var(--color-muted)',
                        fontSize: 'var(--font-size-body)',
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                        style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      <span>Loading vehicle types…</span>
                    </div>
                  ) : typesError && vehicleTypes.length === 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        padding: '0 var(--space-3)',
                        height: 'var(--touch-target-min)',
                        border: '1px solid var(--color-error)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-error-light)',
                        color: 'var(--color-error)',
                        fontSize: 'var(--font-size-small)',
                      }}
                      role="alert"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        style={{ flexShrink: 0 }}
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span style={{ flex: 1 }}>Could not load vehicle types</span>
                      <button
                        type="button"
                        onClick={fetchVehicleTypes}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary)',
                          fontWeight: 'var(--font-weight-semibold)',
                          cursor: 'pointer',
                          fontSize: 'var(--font-size-small)',
                          fontFamily: 'var(--font-family-base)',
                          padding: 0,
                          textDecoration: 'underline',
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <select
                      id="create-schedule-vehicle_type_id"
                      name="vehicle_type_id"
                      value={form.vehicle_type_id}
                      onChange={handleVehicleTypeChange}
                      disabled={submitting}
                      style={{
                        width: '100%',
                        height: 'var(--touch-target-min)',
                        padding: '0 var(--space-3)',
                        fontSize: 'var(--font-size-body)',
                        fontFamily: 'var(--font-family-base)',
                        border: fieldErrors.vehicle_type_id
                          ? '1px solid var(--color-error)'
                          : '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-surface)',
                        color: form.vehicle_type_id ? 'var(--color-body)' : 'var(--color-muted)',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="" disabled>
                        Select a vehicle type…
                      </option>
                      {vehicleTypes.map((vt) => (
                        <option key={vt.id} value={vt.id}>
                          {vt.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {fieldErrors.vehicle_type_id && (
                    <span
                      style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-error)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                      }}
                      role="alert"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {fieldErrors.vehicle_type_id}
                    </span>
                  )}

                  {!fieldErrors.vehicle_type_id && !typesError && (
                    <span
                      style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-muted)',
                        marginTop: 'var(--space-1)',
                      }}
                    >
                      Each vehicle type can have only one active schedule at a time.
                    </span>
                  )}
                </div>

                {/* Vehicle Class (read-only, derived) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label
                    style={{
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-body)',
                      fontSize: 'var(--font-size-body)',
                    }}
                  >
                    Vehicle class
                  </label>
                  <div
                    style={{
                      background: 'var(--color-canvas)',
                      color: vehicleClassDisplay ? 'var(--color-body)' : 'var(--color-muted)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0 var(--space-3)',
                      height: 'var(--touch-target-min)',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 'var(--font-size-body)',
                      fontStyle: vehicleClassDisplay ? 'normal' : 'italic',
                    }}
                  >
                    {vehicleClassDisplay
                      ? vehicleClassDisplay
                      : 'Populated automatically when a vehicle type is selected'}
                  </div>
                  <input
                    type="hidden"
                    name="vehicle_class"
                    id="create-schedule-vehicle_class"
                    value={form.vehicle_class}
                  />
                  <span
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      color: 'var(--color-muted)',
                      marginTop: 'var(--space-1)',
                    }}
                  >
                    Derived from the selected vehicle type — not editable.
                  </span>
                </div>

                {/* Interval row */}
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--space-6)',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* KM Interval */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-1)',
                    }}
                  >
                    <label
                      htmlFor="create-schedule-km_interval"
                      style={{
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-body)',
                        fontSize: 'var(--font-size-body)',
                      }}
                    >
                      Kilometre interval
                      <span
                        style={{ color: 'var(--color-error)', marginLeft: 'var(--space-1)' }}
                        aria-hidden="true"
                      >
                        *
                      </span>
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        id="create-schedule-km_interval"
                        name="km_interval"
                        type="number"
                        min={1}
                        step={500}
                        placeholder="e.g. 15000"
                        value={form.km_interval}
                        onChange={handleKmChange}
                        disabled={submitting}
                        style={{
                          width: '100%',
                          height: 'var(--touch-target-min)',
                          padding: '0 var(--space-8) 0 var(--space-3)',
                          fontSize: 'var(--font-size-body)',
                          fontFamily: 'var(--font-family-base)',
                          border: fieldErrors.km_interval
                            ? '1px solid var(--color-error)'
                            : '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--color-surface)',
                          color: 'var(--color-body)',
                          boxSizing: 'border-box',
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          right: 'var(--space-3)',
                          fontSize: 'var(--font-size-small)',
                          color: 'var(--color-muted)',
                          pointerEvents: 'none',
                        }}
                      >
                        km
                      </span>
                    </div>
                    {fieldErrors.km_interval ? (
                      <span
                        style={{
                          fontSize: 'var(--font-size-caption)',
                          color: 'var(--color-error)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                        }}
                        role="alert"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {fieldErrors.km_interval}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 'var(--font-size-caption)',
                          color: 'var(--color-muted)',
                          marginTop: 'var(--space-1)',
                        }}
                      >
                        Minimum: 1 km
                      </span>
                    )}
                  </div>

                  {/* Month Interval */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-1)',
                    }}
                  >
                    <label
                      htmlFor="create-schedule-month_interval"
                      style={{
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-body)',
                        fontSize: 'var(--font-size-body)',
                      }}
                    >
                      Month interval
                      <span
                        style={{ color: 'var(--color-error)', marginLeft: 'var(--space-1)' }}
                        aria-hidden="true"
                      >
                        *
                      </span>
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        id="create-schedule-month_interval"
                        name="month_interval"
                        type="number"
                        min={1}
                        step={1}
                        placeholder="e.g. 6"
                        value={form.month_interval}
                        onChange={handleMonthChange}
                        disabled={submitting}
                        style={{
                          width: '100%',
                          height: 'var(--touch-target-min)',
                          padding: '0 var(--space-10) 0 var(--space-3)',
                          fontSize: 'var(--font-size-body)',
                          fontFamily: 'var(--font-family-base)',
                          border: fieldErrors.month_interval
                            ? '1px solid var(--color-error)'
                            : '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--color-surface)',
                          color: 'var(--color-body)',
                          boxSizing: 'border-box',
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          right: 'var(--space-3)',
                          fontSize: 'var(--font-size-small)',
                          color: 'var(--color-muted)',
                          pointerEvents: 'none',
                        }}
                      >
                        months
                      </span>
                    </div>
                    {fieldErrors.month_interval ? (
                      <span
                        style={{
                          fontSize: 'var(--font-size-caption)',
                          color: 'var(--color-error)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                        }}
                        role="alert"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {fieldErrors.month_interval}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: 'var(--font-size-caption)',
                          color: 'var(--color-muted)',
                          marginTop: 'var(--space-1)',
                        }}
                      >
                        Minimum: 1 month
                      </span>
                    )}
                  </div>
                </div>

                {/* Active toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--color-canvas)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-4) var(--space-5)',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-body)',
                        fontSize: 'var(--font-size-body)',
                      }}
                    >
                      Active
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--font-size-small)',
                        color: 'var(--color-muted)',
                        marginTop: 'var(--space-1)',
                      }}
                    >
                      When active, this schedule generates service alerts for matching vehicles.
                    </div>
                  </div>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      cursor: 'pointer',
                      flexShrink: 0,
                      marginLeft: 'var(--space-6)',
                    }}
                  >
                    <span
                      id="create-schedule-toggle-label"
                      style={{
                        fontSize: 'var(--font-size-small)',
                        color: 'var(--color-muted)',
                        minWidth: '24px',
                      }}
                    >
                      {form.is_active ? 'On' : 'Off'}
                    </span>
                    <div style={{ position: 'relative', width: '48px', height: '26px' }}>
                      <input
                        type="checkbox"
                        id="create-schedule-is_active"
                        name="is_active"
                        checked={form.is_active}
                        onChange={handleToggle}
                        disabled={submitting}
                        style={{
                          opacity: 0,
                          width: 0,
                          height: 0,
                          position: 'absolute',
                        }}
                      />
                      <div
                        onClick={() =>
                          !submitting &&
                          setForm((prev) => ({ ...prev, is_active: !prev.is_active }))
                        }
                        aria-hidden="true"
                        style={{
                          width: '48px',
                          height: '26px',
                          background: form.is_active
                            ? 'var(--color-primary-dark)'
                            : 'var(--color-disabled)',
                          borderRadius: 'var(--radius-full)',
                          transition: 'background 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 var(--space-1)',
                          cursor: submitting ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            background: 'var(--color-white)',
                            borderRadius: 'var(--radius-full)',
                            boxShadow: 'var(--elevation-1)',
                            transition: 'transform 0.2s',
                            transform: form.is_active ? 'translateX(22px)' : 'translateX(0)',
                          }}
                        />
                      </div>
                    </div>
                  </label>
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px solid var(--color-border-subtle)' }} />

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--space-3)',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="submit"
                    disabled={isSaveDisabled}
                    style={{
                      background: isSaveDisabled
                        ? 'var(--color-disabled)'
                        : 'var(--color-primary-dark)',
                      color: 'var(--color-on-primary-dark)',
                      minHeight: 'var(--touch-target-min)',
                      padding: '0 var(--space-8)',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: 'var(--font-size-body)',
                      fontFamily: 'var(--font-family-base)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: isSaveDisabled ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                    }}
                  >
                    {submitting && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                        style={{ animation: 'spin 1s linear infinite' }}
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    )}
                    {submitting ? 'Saving…' : 'Save schedule'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/schedules')}
                    disabled={submitting}
                    style={{
                      minHeight: 'var(--touch-target-min)',
                      padding: '0 var(--space-5)',
                      color: 'var(--color-muted)',
                      background: 'none',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      fontSize: 'var(--font-size-body)',
                      fontFamily: 'var(--font-family-base)',
                    }}
                  >
                    Cancel
                  </button>
                  <span style={{ flex: 1 }} />
                  <span
                    style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-muted)' }}
                  >
                    <span style={{ color: 'var(--color-error)' }}>*</span> Required fields
                  </span>
                </div>
              </div>
            </form>
          </div>

          {/* Info note */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              alignItems: 'flex-start',
              background: 'var(--color-info-light)',
              color: 'var(--color-on-info)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4) var(--space-5)',
              fontSize: 'var(--font-size-small)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-h3)',
                flexShrink: 0,
                marginTop: '2px',
                color: 'var(--color-ink)',
              }}
              aria-hidden="true"
            >
              ℹ️
            </span>
            <div style={{ color: 'var(--color-ink)' }}>
              <strong
                style={{
                  display: 'block',
                  marginBottom: 'var(--space-1)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-ink)',
                }}
              >
                How intervals work
              </strong>
              FleetOps triggers a service alert when either the kilometre OR the month threshold is
              reached — whichever comes first. Vehicles without an assigned schedule will not generate
              automatic alerts.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </RoleGuard>
  );
};

export default CreateSchedulePage;
