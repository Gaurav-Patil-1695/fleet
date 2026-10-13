import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicles } from '../hooks/useVehicles';
import { listDepots } from '../services/depotsService';
import { listVehicleTypes } from '../services/vehicleTypesService';
import { createVehicle } from '../services/vehiclesService';
import { parseError } from '../utils/errorUtils';
import type { Depot } from '../types/depot';
import type { VehicleType } from '../types/vehicleType';
import type { VehicleCreate } from '../types/vehicle';
import styles from './AddVehiclePage.module.css';

const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

interface FormErrors {
  make?: string;
  model?: string;
  registration_number?: string;
  in_service_date?: string;
  vehicle_type_id?: string;
  depot_id?: string;
  status?: string;
  has_telematics?: string;
}

const AddVehiclePage: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [inServiceDate, setInServiceDate] = useState('');
  const [vehicleTypeId, setVehicleTypeId] = useState('');
  const [depotId, setDepotId] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'decommissioned' | ''>('');
  const [hasTelematics, setHasTelematics] = useState(false);

  // Options state
  const [depots, setDepots] = useState<Depot[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const loadOptions = async () => {
    setOptionsLoading(true);
    setOptionsError(null);
    try {
      const [depotsRes, vehicleTypesRes] = await Promise.all([
        listDepots({ page: 1, pageSize: 200 }),
        listVehicleTypes({ page: 1, pageSize: 200 }),
      ]);
      setDepots(depotsRes.data);
      setVehicleTypes(vehicleTypesRes.data);
    } catch (err: unknown) {
      setOptionsError('Could not load form options. Please try again.');
    } finally {
      setOptionsLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const validate = (): FormErrors => {
    const errors: FormErrors = {};

    if (!make.trim() || make.length > 100) {
      errors.make = 'Vehicle make is required and must not exceed 100 characters.';
    }
    if (!model.trim() || model.length > 100) {
      errors.model = 'Vehicle model is required and must not exceed 100 characters.';
    }
    if (!registrationNumber.trim() || registrationNumber.length > 20) {
      errors.registration_number = 'Registration number is required and must not exceed 20 characters.';
    }
    if (!inServiceDate) {
      errors.in_service_date = 'In-service date is required and must be a valid date.';
    }
    if (!vehicleTypeId || !UUID_PATTERN.test(vehicleTypeId)) {
      errors.vehicle_type_id = 'Vehicle type ID must be a valid UUID.';
    }
    if (!depotId || !UUID_PATTERN.test(depotId)) {
      errors.depot_id = 'Depot ID must be a valid UUID.';
    }
    if (status && status.length > 30) {
      errors.status = 'Status must not exceed 30 characters.';
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError('Vehicle could not be saved. Please check the form and try again.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: VehicleCreate = {
        make: make.trim(),
        model: model.trim(),
        registration_number: registrationNumber.trim().toUpperCase(),
        in_service_date: inServiceDate,
        vehicle_type_id: vehicleTypeId,
        depot_id: depotId,
        has_telematics: hasTelematics,
        ...(status ? { status } : {}),
      };

      const vehicle = await createVehicle(payload);
      navigate(`/vehicles/${vehicle.id}`, { replace: true, state: { toast: 'Vehicle added successfully.' } });
    } catch (err: unknown) {
      const parsed = parseError(err);
      if (parsed.code === '409' || parsed.message?.toLowerCase().includes('duplicate') || parsed.message?.toLowerCase().includes('already')) {
        setFieldErrors((prev) => ({
          ...prev,
          registration_number: 'Registration number is required and must not exceed 20 characters.',
        }));
      }
      setSubmitError('Vehicle could not be saved. Please check the form and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldErrorStyle: React.CSSProperties = {
    color: 'var(--color-error)',
    fontSize: 'var(--font-size-caption)',
    marginTop: 'var(--space-1)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 'var(--font-size-small)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'var(--color-body)',
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    marginTop: 'var(--space-1)',
    width: '100%',
    fontSize: 'var(--font-size-small)',
    padding: 'var(--space-2) var(--space-3)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-surface)',
    color: 'var(--color-body)',
    fontFamily: 'var(--font-family-base)',
    outline: 'none',
    boxSizing: 'border-box',
    minHeight: 'var(--touch-target-min)',
  };

  const inputErrorStyle: React.CSSProperties = {
    ...inputStyle,
    borderColor: 'var(--color-error)',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
  };

  const selectErrorStyle: React.CSSProperties = {
    ...selectStyle,
    borderColor: 'var(--color-error)',
  };

  return (
    <div
      style={{
        padding: 'var(--space-6)',
        maxWidth: 'var(--content-max-width)',
        margin: '0 auto',
        fontFamily: 'var(--font-family-base)',
        color: 'var(--color-body)',
      }}
    >
      <h1
        style={{
          fontSize: 'var(--font-size-h1)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-ink)',
          marginBottom: 'var(--space-2)',
        }}
      >
        Add vehicle
      </h1>
      <p
        style={{
          color: 'var(--color-muted)',
          fontSize: 'var(--font-size-small)',
          marginBottom: 'var(--space-6)',
        }}
      >
        Register a new vehicle to the fleet. All fields marked with * are required.
      </p>

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-6)',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        {/* Main form card */}
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          {/* Options error banner */}
          {optionsError && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                background: 'var(--color-error-light)',
                color: 'var(--color-error)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-4)',
                fontSize: 'var(--font-size-small)',
                border: '1px solid var(--color-error)',
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
              <span style={{ flex: 1 }}>{optionsError}</span>
              <button
                type="button"
                onClick={loadOptions}
                style={{
                  background: 'var(--color-error)',
                  color: 'var(--color-on-error)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: 'var(--space-1) var(--space-3)',
                  fontSize: 'var(--font-size-caption)',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family-base)',
                }}
              >
                Retry
              </button>
            </div>
          )}

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
                color: 'var(--color-error)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-4)',
                fontSize: 'var(--font-size-small)',
                border: '1px solid var(--color-error)',
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

          <div
            style={{
              padding: 'var(--space-6)',
              background: 'var(--color-surface)',
              color: 'var(--color-on-surface)',
              boxShadow: 'var(--elevation-2)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <form onSubmit={handleSubmit} noValidate>
              {/* Section: Vehicle identity */}
              <p
                style={{
                  marginBottom: 'var(--space-4)',
                  color: 'var(--color-muted)',
                  letterSpacing: 'var(--font-letter-spacing-caps)',
                  fontSize: 'var(--font-size-caption)',
                  textTransform: 'uppercase',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                Vehicle identity
              </p>

              {/* Make / Model row */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-4)',
                  flexWrap: 'wrap',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <div style={{ flex: '1 1 180px' }}>
                  <label htmlFor="add-vehicle-make" style={labelStyle}>
                    Make *
                  </label>
                  <input
                    id="add-vehicle-make"
                    name="make"
                    type="text"
                    placeholder="e.g. Mercedes-Benz"
                    autoComplete="off"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    disabled={submitting}
                    maxLength={100}
                    style={fieldErrors.make ? inputErrorStyle : inputStyle}
                  />
                  {fieldErrors.make && (
                    <p style={fieldErrorStyle}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {fieldErrors.make}
                    </p>
                  )}
                </div>

                <div style={{ flex: '1 1 180px' }}>
                  <label htmlFor="add-vehicle-model" style={labelStyle}>
                    Model *
                  </label>
                  <input
                    id="add-vehicle-model"
                    name="model"
                    type="text"
                    placeholder="e.g. Actros 1845"
                    autoComplete="off"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={submitting}
                    maxLength={100}
                    style={fieldErrors.model ? inputErrorStyle : inputStyle}
                  />
                  {fieldErrors.model && (
                    <p style={fieldErrorStyle}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {fieldErrors.model}
                    </p>
                  )}
                </div>
              </div>

              {/* Registration / In-service date row */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-4)',
                  flexWrap: 'wrap',
                  marginBottom: 'var(--space-6)',
                }}
              >
                <div style={{ flex: '1 1 180px' }}>
                  <label htmlFor="add-vehicle-registration_number" style={labelStyle}>
                    Registration number *
                  </label>
                  <input
                    id="add-vehicle-registration_number"
                    name="registration_number"
                    type="text"
                    placeholder="e.g. AB12 CDE"
                    autoComplete="off"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                    disabled={submitting}
                    maxLength={20}
                    style={{
                      ...(fieldErrors.registration_number ? inputErrorStyle : inputStyle),
                      fontFamily: 'var(--font-family-mono)',
                      letterSpacing: 'var(--font-letter-spacing-wide)',
                      textTransform: 'uppercase',
                    }}
                  />
                  {fieldErrors.registration_number && (
                    <p style={fieldErrorStyle}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {fieldErrors.registration_number}
                    </p>
                  )}
                </div>

                <div style={{ flex: '1 1 180px' }}>
                  <label htmlFor="add-vehicle-in_service_date" style={labelStyle}>
                    In-service date *
                  </label>
                  <input
                    id="add-vehicle-in_service_date"
                    name="in_service_date"
                    type="date"
                    value={inServiceDate}
                    onChange={(e) => setInServiceDate(e.target.value)}
                    disabled={submitting}
                    style={fieldErrors.in_service_date ? inputErrorStyle : inputStyle}
                  />
                  {fieldErrors.in_service_date && (
                    <p style={fieldErrorStyle}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {fieldErrors.in_service_date}
                    </p>
                  )}
                </div>
              </div>

              {/* Divider */}
              <hr
                style={{
                  border: 'none',
                  borderTop: '1px solid var(--color-border-subtle)',
                  marginBottom: 'var(--space-6)',
                }}
              />

              {/* Section: Classification & assignment */}
              <p
                style={{
                  marginBottom: 'var(--space-4)',
                  color: 'var(--color-muted)',
                  letterSpacing: 'var(--font-letter-spacing-caps)',
                  fontSize: 'var(--font-size-caption)',
                  textTransform: 'uppercase',
                  fontWeight: 'var(--font-weight-semibold)',
                }}
              >
                Classification &amp; assignment
              </p>

              {/* Vehicle type / Depot row */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-4)',
                  flexWrap: 'wrap',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <div style={{ flex: '1 1 180px' }}>
                  <label htmlFor="add-vehicle-vehicle_type_id" style={labelStyle}>
                    Vehicle type *
                  </label>
                  <select
                    id="add-vehicle-vehicle_type_id"
                    name="vehicle_type_id"
                    value={vehicleTypeId}
                    onChange={(e) => setVehicleTypeId(e.target.value)}
                    disabled={submitting || optionsLoading}
                    style={fieldErrors.vehicle_type_id ? selectErrorStyle : selectStyle}
                  >
                    <option value="" disabled>
                      {optionsLoading ? 'Loading…' : 'Select vehicle type'}
                    </option>
                    {vehicleTypes.map((vt) => (
                      <option key={vt.id} value={vt.id}>
                        {vt.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.vehicle_type_id && (
                    <p style={fieldErrorStyle}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {fieldErrors.vehicle_type_id}
                    </p>
                  )}
                </div>

                <div style={{ flex: '1 1 180px' }}>
                  <label htmlFor="add-vehicle-depot_id" style={labelStyle}>
                    Depot *
                  </label>
                  <select
                    id="add-vehicle-depot_id"
                    name="depot_id"
                    value={depotId}
                    onChange={(e) => setDepotId(e.target.value)}
                    disabled={submitting || optionsLoading}
                    style={fieldErrors.depot_id ? selectErrorStyle : selectStyle}
                  >
                    <option value="" disabled>
                      {optionsLoading ? 'Loading…' : 'Select depot'}
                    </option>
                    {depots.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.depot_id && (
                    <p style={fieldErrorStyle}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {fieldErrors.depot_id}
                    </p>
                  )}
                </div>
              </div>

              {/* Status / Telematics row */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-4)',
                  flexWrap: 'wrap',
                  marginBottom: 'var(--space-6)',
                }}
              >
                <div style={{ flex: '1 1 180px' }}>
                  <label htmlFor="add-vehicle-status" style={labelStyle}>
                    Status *
                  </label>
                  <select
                    id="add-vehicle-status"
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive' | 'decommissioned' | '')}
                    disabled={submitting}
                    style={fieldErrors.status ? selectErrorStyle : selectStyle}
                  >
                    <option value="" disabled>
                      Select status
                    </option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="decommissioned">Decommissioned</option>
                  </select>
                  {fieldErrors.status && (
                    <p style={fieldErrorStyle}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {fieldErrors.status}
                    </p>
                  )}
                </div>

                <div
                  style={{
                    flex: '1 1 180px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-4)',
                      background: 'var(--color-canvas)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      marginTop: 'var(--space-1)',
                      minHeight: 'var(--touch-target-min)',
                      color: 'var(--color-on-canvas)',
                    }}
                  >
                    <input
                      type="checkbox"
                      id="add-vehicle-has_telematics"
                      name="has_telematics"
                      checked={hasTelematics}
                      onChange={(e) => setHasTelematics(e.target.checked)}
                      disabled={submitting}
                      style={{
                        width: '18px',
                        height: '18px',
                        accentColor: 'var(--color-primary)',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <label
                        htmlFor="add-vehicle-has_telematics"
                        style={{
                          fontSize: 'var(--font-size-small)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--color-body)',
                          cursor: 'pointer',
                          display: 'block',
                          lineHeight: 'var(--font-line-height-small)',
                        }}
                      >
                        Telematics fitted
                      </label>
                      <span
                        style={{
                          fontSize: 'var(--font-size-caption)',
                          color: 'var(--color-muted)',
                          lineHeight: 'var(--font-line-height-caption)',
                        }}
                      >
                        Vehicle has GPS / tracking unit installed
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <hr
                style={{
                  border: 'none',
                  borderTop: '1px solid var(--color-border-subtle)',
                  marginBottom: 'var(--space-5)',
                }}
              />

              {/* Form actions */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => navigate('/vehicles')}
                  disabled={submitting}
                  style={{
                    minWidth: '100px',
                    padding: 'var(--space-2) var(--space-5)',
                    fontSize: 'var(--font-size-small)',
                    fontWeight: 'var(--font-weight-semibold)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    color: 'var(--color-body)',
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
                  disabled={submitting || optionsLoading}
                  style={{
                    minWidth: '140px',
                    padding: 'var(--space-2) var(--space-5)',
                    fontSize: 'var(--font-size-small)',
                    fontWeight: 'var(--font-weight-semibold)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: submitting || optionsLoading ? 'var(--color-disabled)' : 'var(--color-primary)',
                    color: submitting || optionsLoading ? 'var(--color-muted)' : 'var(--color-on-primary)',
                    cursor: submitting || optionsLoading ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-family-base)',
                    minHeight: 'var(--touch-target-min)',
                  }}
                >
                  {submitting ? 'Saving…' : 'Add vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Help / guidance sidebar */}
        <div
          style={{
            flex: '0 0 260px',
            minWidth: '200px',
            maxWidth: '280px',
          }}
        >
          <div
            style={{
              padding: 'var(--space-5)',
              background: 'var(--color-info-light)',
              color: 'var(--color-on-info)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 'var(--space-4)',
              borderLeft: '4px solid var(--color-info)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--font-size-small)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-2)',
                color: 'var(--color-ink)',
              }}
            >
              📋 Before you begin
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: 'var(--space-5)',
                fontSize: 'var(--font-size-caption)',
                color: 'var(--color-ink)',
                lineHeight: 'var(--font-line-height-body)',
              }}
            >
              <li style={{ marginBottom: 'var(--space-2)', color: 'var(--color-ink)' }}>
                Ensure the registration plate matches the V5C document exactly.
              </li>
              <li style={{ marginBottom: 'var(--space-2)', color: 'var(--color-ink)' }}>
                Select the depot the vehicle will be primarily based at.
              </li>
              <li style={{ color: 'var(--color-ink)' }}>
                Mark telematics only if the unit has been physically installed and configured.
              </li>
            </ul>
          </div>

          <div
            style={{
              padding: 'var(--space-5)',
              background: 'var(--color-surface)',
              color: 'var(--color-on-surface)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--elevation-1)',
            }}
          >
            <p
              style={{
                color: 'var(--color-muted)',
                fontSize: 'var(--font-size-caption)',
                letterSpacing: 'var(--font-letter-spacing-caps)',
                textTransform: 'uppercase',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-3)',
              }}
            >
              Status guide
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <span
                  style={{
                    background: 'var(--color-success-light)',
                    color: 'var(--color-ink)',
                    fontSize: 'var(--font-size-caption)',
                    padding: 'var(--space-1) var(--space-2)',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 'var(--font-weight-medium)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Active
                </span>
                <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-muted)' }}>
                  In regular fleet operation
                </span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <span
                  style={{
                    background: 'var(--color-warning-light)',
                    color: 'var(--color-ink)',
                    fontSize: 'var(--font-size-caption)',
                    padding: 'var(--space-1) var(--space-2)',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 'var(--font-weight-medium)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Inactive
                </span>
                <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-muted)' }}>
                  Temporarily not in use
                </span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <span
                  style={{
                    background: 'var(--color-surface-raised)',
                    color: 'var(--color-muted)',
                    fontSize: 'var(--font-size-caption)',
                    padding: 'var(--space-1) var(--space-2)',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 'var(--font-weight-medium)',
                    border: '1px solid var(--color-border)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Decommissioned
                </span>
                <span style={{ fontSize: 'var(--font-size-caption)', color: 'var(--color-muted)' }}>
                  Permanently retired
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddVehiclePage;
