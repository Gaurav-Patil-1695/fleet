import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getVehicle, updateVehicle } from '../services/vehiclesService';
import { listDepots } from '../services/depotsService';
import { listVehicleTypes } from '../services/vehicleTypesService';
import { parseError } from '../utils/errorUtils';
import { formatDate } from '../utils/dateUtils';
import type { Vehicle, VehicleUpdate } from '../types/vehicle';
import type { Depot } from '../types/depot';
import type { VehicleType } from '../types/vehicleType';
import styles from './EditVehiclePage.module.css';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

interface FormValues {
  registration_number: string;
  make: string;
  model: string;
  vehicle_type_id: string;
  depot_id: string;
  status: 'active' | 'inactive' | 'decommissioned';
  in_service_date: string;
  has_telematics: boolean;
}

interface FieldErrors {
  registration_number?: string;
  make?: string;
  model?: string;
  vehicle_type_id?: string;
  depot_id?: string;
  status?: string;
  in_service_date?: string;
  has_telematics?: string;
}

function validateForm(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (values.registration_number.length > 20) {
    errors.registration_number = 'Registration number must not exceed 20 characters.';
  }
  if (values.make.length > 100) {
    errors.make = 'Vehicle make must not exceed 100 characters.';
  }
  if (values.model.length > 100) {
    errors.model = 'Vehicle model must not exceed 100 characters.';
  }
  if (values.vehicle_type_id && !UUID_REGEX.test(values.vehicle_type_id)) {
    errors.vehicle_type_id = 'Vehicle type ID must be a valid UUID.';
  }
  if (values.depot_id && !UUID_REGEX.test(values.depot_id)) {
    errors.depot_id = 'Depot ID must be a valid UUID.';
  }
  if (values.in_service_date && isNaN(Date.parse(values.in_service_date))) {
    errors.in_service_date = 'In-service date must be a valid date.';
  }
  if (values.status.length > 30) {
    errors.status = 'Status must not exceed 30 characters.';
  }

  return errors;
}

const EditVehiclePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);

  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [loadingDepots, setLoadingDepots] = useState(true);
  const [loadingVehicleTypes, setLoadingVehicleTypes] = useState(true);

  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formValues, setFormValues] = useState<FormValues>({
    registration_number: '',
    make: '',
    model: '',
    vehicle_type_id: '',
    depot_id: '',
    status: 'active',
    in_service_date: '',
    has_telematics: false,
  });

  const isLoading = loadingVehicle || loadingDepots || loadingVehicleTypes;

  // Fetch vehicle
  useEffect(() => {
    if (!id) {
      setFetchError('Vehicle record could not be loaded');
      setLoadingVehicle(false);
      return;
    }
    setLoadingVehicle(true);
    getVehicle(id)
      .then((v) => {
        setVehicle(v);
        setFormValues({
          registration_number: v.registration_number,
          make: v.make,
          model: v.model,
          vehicle_type_id: v.vehicle_type_id,
          depot_id: v.depot_id,
          status: v.status,
          in_service_date: v.in_service_date ?? '',
          has_telematics: v.has_telematics,
        });
      })
      .catch(() => {
        setFetchError('Vehicle record could not be loaded');
      })
      .finally(() => {
        setLoadingVehicle(false);
      });
  }, [id]);

  // Fetch depots
  useEffect(() => {
    setLoadingDepots(true);
    listDepots({ page: 1, pageSize: 200 })
      .then((res) => {
        setDepots(res.data);
      })
      .catch(() => {
        // non-fatal; keep empty
      })
      .finally(() => {
        setLoadingDepots(false);
      });
  }, []);

  // Fetch vehicle types
  useEffect(() => {
    setLoadingVehicleTypes(true);
    listVehicleTypes({ page: 1, pageSize: 200 })
      .then((res) => {
        setVehicleTypes(res.data);
      })
      .catch(() => {
        // non-fatal; keep empty
      })
      .finally(() => {
        setLoadingVehicleTypes(false);
      });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormValues((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormValues((prev) => ({ ...prev, [name]: value }));
    }
    // Clear field error on change
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    const errors = validateForm(formValues);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (!id) return;

    setSubmitting(true);
    try {
      const payload: VehicleUpdate = {
        registration_number: formValues.registration_number || undefined,
        make: formValues.make || undefined,
        model: formValues.model || undefined,
        vehicle_type_id: formValues.vehicle_type_id || undefined,
        depot_id: formValues.depot_id || undefined,
        status: formValues.status || undefined,
        in_service_date: formValues.in_service_date || undefined,
        has_telematics: formValues.has_telematics,
      };

      await updateVehicle(id, payload);
      navigate(`/vehicles/${id}`, {
        state: { toast: { message: 'Vehicle updated successfully.', type: 'success' } },
      });
    } catch (err: unknown) {
      const parsed = parseError(err);
      setSubmitError('Changes could not be saved. Please try again.');
      // attempt to populate field errors from details
      if (parsed.details && typeof parsed.details === 'object') {
        const fe: FieldErrors = {};
        for (const [key, val] of Object.entries(parsed.details as Record<string, unknown>)) {
          if (typeof val === 'string') {
            (fe as Record<string, string>)[key] = val;
          }
        }
        setFieldErrors(fe);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const vehicleLabel = vehicle
    ? `${vehicle.registration_number} · ${vehicle.make} ${vehicle.model}`
    : '';

  // Render skeleton input
  const SkeletonInput = () => (
    <div
      aria-hidden="true"
      style={{
        height: '40px',
        borderRadius: 'var(--radius-sm)',
        background:
          'linear-gradient(90deg, var(--color-surface-raised) 25%, var(--color-canvas) 50%, var(--color-surface-raised) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
        marginTop: 'var(--space-2)',
      }}
    />
  );

  if (fetchError) {
    return (
      <div className={styles.page}>
        <div
          role="alert"
          style={{
            background: 'var(--color-error-light)',
            border: '1px solid var(--color-error)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
            maxWidth: 'var(--content-narrow-width)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--font-size-body)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-error)',
              margin: 0,
            }}
          >
            Vehicle record could not be loaded
          </p>
          <button
            type="button"
            onClick={() => navigate('/vehicles')}
            style={{
              alignSelf: 'flex-start',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-primary)',
              fontSize: 'var(--font-size-small)',
              cursor: 'pointer',
              fontFamily: 'var(--font-family-base)',
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            ← Back to vehicle list
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Page title */}
      <h1
        style={{
          fontSize: 'var(--font-size-h1)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-body)',
          marginBottom: 'var(--space-2)',
          fontFamily: 'var(--font-family-base)',
        }}
      >
        Edit Vehicle
      </h1>

      {/* Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <button
          type="button"
          onClick={() => navigate(`/vehicles/${id}`)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            color: 'var(--color-muted)',
            fontSize: 'var(--font-size-small)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-family-base)',
            padding: 0,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 12L6 8l4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to vehicle
        </button>
        <span style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-small)' }}>/</span>
        {isLoading ? (
          <span
            style={{
              display: 'inline-block',
              width: '140px',
              height: '16px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--color-surface-raised)',
              animation: 'shimmer 1.4s infinite',
            }}
            aria-hidden="true"
          />
        ) : (
          <span style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-small)' }}>
            {vehicleLabel}
          </span>
        )}
      </div>

      <div style={{ maxWidth: 'var(--content-narrow-width)' }}>
        <div
          style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--elevation-2)',
          }}
        >
          {/* Submit error banner */}
          {submitError && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                background: 'var(--color-error-light)',
                border: '1px solid var(--color-error)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--space-5)',
                fontSize: 'var(--font-size-small)',
                color: 'var(--color-error)',
              }}
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
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Section: Vehicle identity */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <p
                style={{
                  color: 'var(--color-muted)',
                  fontSize: 'var(--font-size-caption)',
                  fontWeight: 'var(--font-weight-semibold)',
                  letterSpacing: 'var(--font-letter-spacing-caps)',
                  textTransform: 'uppercase',
                  marginBottom: 'var(--space-3)',
                  margin: '0 0 var(--space-3) 0',
                }}
              >
                Vehicle identity
              </p>

              {/* Row 1: Registration + Make */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-5)',
                  flexWrap: 'wrap',
                }}
              >
                {/* Registration number */}
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label
                    htmlFor="edit-vehicle-registration_number"
                    style={{
                      display: 'block',
                      fontWeight: 'var(--font-weight-medium)',
                      fontSize: 'var(--font-size-small)',
                      color: 'var(--color-body)',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    Registration number <span style={{ color: 'var(--color-ink)' }}>*</span>
                  </label>
                  {isLoading ? (
                    <SkeletonInput />
                  ) : (
                    <input
                      id="edit-vehicle-registration_number"
                      name="registration_number"
                      type="text"
                      value={formValues.registration_number}
                      onChange={handleChange}
                      placeholder="e.g. AB12 CDE"
                      maxLength={20}
                      disabled={submitting}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        fontSize: 'var(--font-size-small)',
                        fontFamily: 'var(--font-family-mono)',
                        letterSpacing: 'var(--font-letter-spacing-wide)',
                        padding: 'var(--space-2) var(--space-3)',
                        border: fieldErrors.registration_number
                          ? '1px solid var(--color-error)'
                          : '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-body)',
                        outline: 'none',
                      }}
                    />
                  )}
                  {fieldErrors.registration_number && (
                    <p
                      style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-error)',
                        marginTop: 'var(--space-1)',
                        margin: 'var(--space-1) 0 0 0',
                      }}
                    >
                      {fieldErrors.registration_number}
                    </p>
                  )}
                </div>

                {/* Make */}
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label
                    htmlFor="edit-vehicle-make"
                    style={{
                      display: 'block',
                      fontWeight: 'var(--font-weight-medium)',
                      fontSize: 'var(--font-size-small)',
                      color: 'var(--color-body)',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    Make <span style={{ color: 'var(--color-ink)' }}>*</span>
                  </label>
                  {isLoading ? (
                    <SkeletonInput />
                  ) : (
                    <input
                      id="edit-vehicle-make"
                      name="make"
                      type="text"
                      value={formValues.make}
                      onChange={handleChange}
                      placeholder="e.g. Volvo, MAN, DAF"
                      maxLength={100}
                      disabled={submitting}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        fontSize: 'var(--font-size-small)',
                        fontFamily: 'var(--font-family-base)',
                        padding: 'var(--space-2) var(--space-3)',
                        border: fieldErrors.make
                          ? '1px solid var(--color-error)'
                          : '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-body)',
                        outline: 'none',
                      }}
                    />
                  )}
                  {fieldErrors.make && (
                    <p
                      style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-error)',
                        marginTop: 'var(--space-1)',
                        margin: 'var(--space-1) 0 0 0',
                      }}
                    >
                      {fieldErrors.make}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Model + Vehicle type */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-5)',
                  flexWrap: 'wrap',
                  marginTop: 'var(--space-4)',
                }}
              >
                {/* Model */}
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label
                    htmlFor="edit-vehicle-model"
                    style={{
                      display: 'block',
                      fontWeight: 'var(--font-weight-medium)',
                      fontSize: 'var(--font-size-small)',
                      color: 'var(--color-body)',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    Model <span style={{ color: 'var(--color-ink)' }}>*</span>
                  </label>
                  {isLoading ? (
                    <SkeletonInput />
                  ) : (
                    <input
                      id="edit-vehicle-model"
                      name="model"
                      type="text"
                      value={formValues.model}
                      onChange={handleChange}
                      placeholder="e.g. FH16, TGX, CF"
                      maxLength={100}
                      disabled={submitting}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        fontSize: 'var(--font-size-small)',
                        fontFamily: 'var(--font-family-base)',
                        padding: 'var(--space-2) var(--space-3)',
                        border: fieldErrors.model
                          ? '1px solid var(--color-error)'
                          : '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-body)',
                        outline: 'none',
                      }}
                    />
                  )}
                  {fieldErrors.model && (
                    <p
                      style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-error)',
                        marginTop: 'var(--space-1)',
                        margin: 'var(--space-1) 0 0 0',
                      }}
                    >
                      {fieldErrors.model}
                    </p>
                  )}
                </div>

                {/* Vehicle type */}
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label
                    htmlFor="edit-vehicle-vehicle_type_id"
                    style={{
                      display: 'block',
                      fontWeight: 'var(--font-weight-medium)',
                      fontSize: 'var(--font-size-small)',
                      color: 'var(--color-body)',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    Vehicle type <span style={{ color: 'var(--color-ink)' }}>*</span>
                  </label>
                  {isLoading ? (
                    <SkeletonInput />
                  ) : (
                    <select
                      id="edit-vehicle-vehicle_type_id"
                      name="vehicle_type_id"
                      value={formValues.vehicle_type_id}
                      onChange={handleChange}
                      disabled={submitting}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        fontSize: 'var(--font-size-small)',
                        fontFamily: 'var(--font-family-base)',
                        padding: 'var(--space-2) var(--space-3)',
                        border: fieldErrors.vehicle_type_id
                          ? '1px solid var(--color-error)'
                          : '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-body)',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Select a type…</option>
                      {vehicleTypes.map((vt) => (
                        <option key={vt.id} value={vt.id}>
                          {vt.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {fieldErrors.vehicle_type_id && (
                    <p
                      style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-error)',
                        marginTop: 'var(--space-1)',
                        margin: 'var(--space-1) 0 0 0',
                      }}
                    >
                      {fieldErrors.vehicle_type_id}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <hr
              style={{
                border: 'none',
                borderTop: '1px solid var(--color-border-subtle)',
                margin: 'var(--space-6) 0',
              }}
            />

            {/* Section: Operations */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <p
                style={{
                  color: 'var(--color-muted)',
                  fontSize: 'var(--font-size-caption)',
                  fontWeight: 'var(--font-weight-semibold)',
                  letterSpacing: 'var(--font-letter-spacing-caps)',
                  textTransform: 'uppercase',
                  margin: '0 0 var(--space-3) 0',
                }}
              >
                Operations
              </p>

              {/* Row 1: Depot + Status */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-5)',
                  flexWrap: 'wrap',
                }}
              >
                {/* Assigned depot */}
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label
                    htmlFor="edit-vehicle-depot_id"
                    style={{
                      display: 'block',
                      fontWeight: 'var(--font-weight-medium)',
                      fontSize: 'var(--font-size-small)',
                      color: 'var(--color-body)',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    Assigned depot <span style={{ color: 'var(--color-ink)' }}>*</span>
                  </label>
                  {isLoading ? (
                    <SkeletonInput />
                  ) : (
                    <select
                      id="edit-vehicle-depot_id"
                      name="depot_id"
                      value={formValues.depot_id}
                      onChange={handleChange}
                      disabled={submitting}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        fontSize: 'var(--font-size-small)',
                        fontFamily: 'var(--font-family-base)',
                        padding: 'var(--space-2) var(--space-3)',
                        border: fieldErrors.depot_id
                          ? '1px solid var(--color-error)'
                          : '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-body)',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="">Select a depot…</option>
                      {depots.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {fieldErrors.depot_id && (
                    <p
                      style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-error)',
                        marginTop: 'var(--space-1)',
                        margin: 'var(--space-1) 0 0 0',
                      }}
                    >
                      {fieldErrors.depot_id}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label
                    htmlFor="edit-vehicle-status"
                    style={{
                      display: 'block',
                      fontWeight: 'var(--font-weight-medium)',
                      fontSize: 'var(--font-size-small)',
                      color: 'var(--color-body)',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    Status <span style={{ color: 'var(--color-ink)' }}>*</span>
                  </label>
                  {isLoading ? (
                    <SkeletonInput />
                  ) : (
                    <select
                      id="edit-vehicle-status"
                      name="status"
                      value={formValues.status}
                      onChange={handleChange}
                      disabled={submitting}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        fontSize: 'var(--font-size-small)',
                        fontFamily: 'var(--font-family-base)',
                        padding: 'var(--space-2) var(--space-3)',
                        border: fieldErrors.status
                          ? '1px solid var(--color-error)'
                          : '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-body)',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="decommissioned">Decommissioned</option>
                    </select>
                  )}
                  {fieldErrors.status && (
                    <p
                      style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-error)',
                        marginTop: 'var(--space-1)',
                        margin: 'var(--space-1) 0 0 0',
                      }}
                    >
                      {fieldErrors.status}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: In-service date + Telematics */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-5)',
                  flexWrap: 'wrap',
                  marginTop: 'var(--space-4)',
                }}
              >
                {/* In-service date */}
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label
                    htmlFor="edit-vehicle-in_service_date"
                    style={{
                      display: 'block',
                      fontWeight: 'var(--font-weight-medium)',
                      fontSize: 'var(--font-size-small)',
                      color: 'var(--color-body)',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    In-service date
                  </label>
                  {isLoading ? (
                    <SkeletonInput />
                  ) : (
                    <input
                      id="edit-vehicle-in_service_date"
                      name="in_service_date"
                      type="date"
                      value={formValues.in_service_date}
                      onChange={handleChange}
                      disabled={submitting}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        fontSize: 'var(--font-size-small)',
                        fontFamily: 'var(--font-family-base)',
                        padding: 'var(--space-2) var(--space-3)',
                        border: fieldErrors.in_service_date
                          ? '1px solid var(--color-error)'
                          : '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-surface)',
                        color: 'var(--color-body)',
                        outline: 'none',
                      }}
                    />
                  )}
                  {fieldErrors.in_service_date && (
                    <p
                      style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-error)',
                        marginTop: 'var(--space-1)',
                        margin: 'var(--space-1) 0 0 0',
                      }}
                    >
                      {fieldErrors.in_service_date}
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      color: 'var(--color-muted)',
                      marginTop: 'var(--space-1)',
                      margin: 'var(--space-1) 0 0 0',
                    }}
                  >
                    Date the vehicle entered operational service.
                  </p>
                </div>

                {/* Telematics unit */}
                <div
                  style={{
                    flex: 1,
                    minWidth: '180px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                  }}
                >
                  <label
                    style={{
                      display: 'block',
                      fontWeight: 'var(--font-weight-medium)',
                      fontSize: 'var(--font-size-small)',
                      color: 'var(--color-body)',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    Telematics unit fitted
                  </label>
                  {isLoading ? (
                    <SkeletonInput />
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        background: 'var(--color-surface-raised)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-3) var(--space-4)',
                        border: '1px solid var(--color-border-subtle)',
                        minHeight: 'var(--touch-target-min)',
                        color: 'var(--color-on-surface-raised)',
                      }}
                    >
                      <input
                        type="checkbox"
                        id="edit-vehicle-has_telematics"
                        name="has_telematics"
                        checked={formValues.has_telematics}
                        onChange={handleChange}
                        disabled={submitting}
                        style={{
                          width: '20px',
                          height: '20px',
                          accentColor: 'var(--color-primary)',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      />
                      <label
                        htmlFor="edit-vehicle-has_telematics"
                        style={{
                          fontSize: 'var(--font-size-small)',
                          color: 'var(--color-body)',
                          cursor: 'pointer',
                          userSelect: 'none',
                          lineHeight: 'var(--font-line-height-small)',
                        }}
                      >
                        This vehicle has a telematics unit installed
                      </label>
                    </div>
                  )}
                  {fieldErrors.has_telematics && (
                    <p
                      style={{
                        fontSize: 'var(--font-size-caption)',
                        color: 'var(--color-error)',
                        marginTop: 'var(--space-1)',
                        margin: 'var(--space-1) 0 0 0',
                      }}
                    >
                      {fieldErrors.has_telematics}
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      color: 'var(--color-muted)',
                      marginTop: 'var(--space-1)',
                      margin: 'var(--space-1) 0 0 0',
                    }}
                  >
                    Enables automatic odometer readings and GPS tracking.
                  </p>
                </div>
              </div>
            </div>

            <hr
              style={{
                border: 'none',
                borderTop: '1px solid var(--color-border-subtle)',
                margin: 'var(--space-6) 0',
              }}
            />

            {/* Current status summary */}
            {vehicle && !isLoading && (
              <div
                style={{
                  background: 'var(--color-canvas)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-4) var(--space-5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-5)',
                  flexWrap: 'wrap',
                  marginBottom: 'var(--space-6)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-on-canvas)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-1)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      color: 'var(--color-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--font-letter-spacing-caps)',
                      fontWeight: 'var(--font-weight-semibold)',
                    }}
                  >
                    Current status
                  </span>
                  <span
                    style={{
                      alignSelf: 'flex-start',
                      display: 'inline-block',
                      padding: 'var(--space-1) var(--space-2)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--font-size-caption)',
                      fontWeight: 'var(--font-weight-semibold)',
                      background:
                        vehicle.status === 'active'
                          ? 'var(--color-success-light)'
                          : vehicle.status === 'inactive'
                          ? 'var(--color-warning-light)'
                          : 'var(--color-surface-raised)',
                      color:
                        vehicle.status === 'decommissioned'
                          ? 'var(--color-muted)'
                          : 'var(--color-ink)',
                    }}
                  >
                    {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                  </span>
                </div>

                <div
                  style={{
                    width: '1px',
                    height: '36px',
                    background: 'var(--color-border-subtle)',
                    flexShrink: 0,
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-1)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--font-size-caption)',
                      color: 'var(--color-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: 'var(--font-letter-spacing-caps)',
                      fontWeight: 'var(--font-weight-semibold)',
                    }}
                  >
                    Last updated
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--font-size-small)',
                      color: 'var(--color-body)',
                      fontWeight: 'var(--font-weight-medium)',
                    }}
                  >
                    {formatDate(vehicle.updated_at)}
                  </span>
                </div>
              </div>
            )}

            {/* Form actions */}
            <div
              style={{
                display: 'flex',
                gap: 'var(--space-3)',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              {/* Remove vehicle (danger) */}
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={submitting || isLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  background: 'transparent',
                  color: 'var(--color-error)',
                  border: '1px solid var(--color-error-light)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-2) var(--space-4)',
                  fontSize: 'var(--font-size-small)',
                  fontWeight: 'var(--font-weight-medium)',
                  cursor: submitting || isLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-family-base)',
                  minHeight: 'var(--touch-target-min)',
                  opacity: submitting || isLoading ? 0.6 : 1,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M2 4h12M5 4V2.667A.667.667 0 015.667 2h4.666A.667.667 0 0111 2.667V4M6.333 7.333v4M9.667 7.333v4M3.333 4l.667 9.333A.667.667 0 004.667 14h6.666a.667.667 0 00.667-.667L12.667 4"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Remove vehicle
              </button>

              {/* Cancel + Save */}
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button
                  type="button"
                  onClick={() => navigate(`/vehicles/${id}`)}
                  disabled={submitting}
                  style={{
                    background: 'var(--color-surface)',
                    color: 'var(--color-body)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-2) var(--space-5)',
                    fontSize: 'var(--font-size-small)',
                    fontWeight: 'var(--font-weight-medium)',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-family-base)',
                    minHeight: 'var(--touch-target-min)',
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || isLoading}
                  style={{
                    background:
                      submitting || isLoading ? 'var(--color-disabled)' : 'var(--color-primary)',
                    color: 'var(--color-on-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-2) var(--space-5)',
                    fontSize: 'var(--font-size-small)',
                    fontWeight: 'var(--font-weight-semibold)',
                    cursor: submitting || isLoading ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-family-base)',
                    minHeight: 'var(--touch-target-min)',
                  }}
                >
                  {submitting ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--color-overlay)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-4)',
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-6)',
              maxWidth: '400px',
              width: '100%',
              boxShadow: 'var(--elevation-3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-confirm-title"
              style={{
                fontSize: 'var(--font-size-h3)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-body)',
                marginBottom: 'var(--space-3)',
                margin: '0 0 var(--space-3) 0',
              }}
            >
              Remove vehicle?
            </h2>
            <p
              style={{
                fontSize: 'var(--font-size-small)',
                color: 'var(--color-muted)',
                marginBottom: 'var(--space-6)',
                margin: '0 0 var(--space-6) 0',
              }}
            >
              This action is not implemented in this phase. Vehicle removal is out of scope for
              this release.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  background: 'var(--color-surface)',
                  color: 'var(--color-body)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-2) var(--space-4)',
                  fontSize: 'var(--font-size-small)',
                  fontWeight: 'var(--font-weight-medium)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family-base)',
                  minHeight: 'var(--touch-target-min)',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditVehiclePage;
