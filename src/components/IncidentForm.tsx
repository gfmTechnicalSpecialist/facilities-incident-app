import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { AppUser, IncidentCategory, IncidentFormValues } from '../types';
import {
  actionStatuses,
  impacts,
  incidentCategories,
  incidentCategoryMap,
  rootCauseCategories,
  severities,
  sites,
} from '../utils/constants';

interface IncidentFormProps {
  currentUser: AppUser;
  initialValues?: IncidentFormValues;
  onSubmit: (values: IncidentFormValues) => void;
  submitLabel: string;
  submitDisabled?: boolean;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getNowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

function buildDefaultValues(user: AppUser): IncidentFormValues {
  return {
    title: '',
    reporterName: user.fullName,
    designation: 'Facilities Administrator',
    department: user.department,
    contact: '',
    email: user.email,
    incidentDate: getToday(),
    incidentTime: getNowTime(),
    site: 'PDC',
    specificLocation: '',
    impactedAreaSystem: '',
    incidentCategory: 'Equipment & Systems',
    incidentType: 'Electrical Issue',
    otherIncidentType: '',
    severity: 'Moderate',
    description: '',
    facilitiesAction: '',
    vendorAction: '',
    criticalLoadAffected: false,
    mitigationApplied: '',
    impactOnOperations: 'Minor',
    jiraTicketReference: '',
    systemRestored: false,
    restoredAt: '',
    incidentSummary: '',
    why1: '',
    why2: '',
    why3: '',
    why4: '',
    why5: '',
    rootCauseCategory: 'Equipment Failure',
    recommendations: '',
    lessonsLearned: '',
    followUpRequired: false,
    responsiblePerson: '',
    targetCompletionDate: '',
    actionStatus: 'Open',
    submittedBy: user.fullName,
  };
}

function RequiredLabel({ children }: { children: string }) {
  return (
    <span>
      {children} <strong className="required-mark">*</strong>
    </span>
  );
}

export function IncidentForm({ currentUser, initialValues, onSubmit, submitLabel, submitDisabled }: IncidentFormProps) {
  const [values, setValues] = useState<IncidentFormValues>(() => initialValues ?? buildDefaultValues(currentUser));
  const [touched, setTouched] = useState(false);

  const availableTypes = incidentCategoryMap[values.incidentCategory] ?? ['Other'];
  const showOtherType = values.incidentType === 'Other';

  useEffect(() => {
    if (!availableTypes.includes(values.incidentType)) {
      setValues((previous) => ({ ...previous, incidentType: availableTypes[0], otherIncidentType: '' }));
    }
  }, [availableTypes, values.incidentType]);

  const fieldErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!values.title?.trim())               errs.title               = 'Short title is required.';
    if (!values.specificLocation?.trim())    errs.specificLocation    = 'Specific location is required.';
    if (!values.impactedAreaSystem?.trim())  errs.impactedAreaSystem  = 'Impacted area/system is required.';
    if (!values.description?.trim())         errs.description         = 'Description is required.';
    if (showOtherType && !values.otherIncidentType?.trim()) errs.otherIncidentType = 'Please specify the other incident type.';
    if (!values.incidentSummary?.trim())     errs.incidentSummary     = 'Incident summary is required.';
    if (!values.why1?.trim())                errs.why1                = 'Why 1 is required.';
    if (!values.why2?.trim())                errs.why2                = 'Why 2 is required.';
    if (!values.why3?.trim())                errs.why3                = 'Why 3 is required.';
    if (!values.why4?.trim())                errs.why4                = 'Why 4 is required.';
    if (!values.why5?.trim())                errs.why5                = 'Why 5 is required.';
    if (!values.recommendations?.trim())     errs.recommendations     = 'Recommendations are required.';
    if (!values.lessonsLearned?.trim())      errs.lessonsLearned      = 'Lessons learned is required.';
    if (values.followUpRequired && !values.targetCompletionDate) errs.targetCompletionDate = 'Target completion date is required when follow-up is checked.';
    if (values.systemRestored && !values.restoredAt) errs.restoredAt  = 'Restore date/time is required when system is marked restored.';
    return errs;
  }, [values, showOtherType]);

  const hasErrors = Object.keys(fieldErrors).length > 0;

  function fi(field: string) {
    return touched && fieldErrors[field] ? 'field-invalid' : '';
  }

  function update<K extends keyof IncidentFormValues>(key: K, value: IncidentFormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  function handleCategoryChange(category: IncidentCategory) {
    const nextType = incidentCategoryMap[category][0];
    setValues((previous) => ({
      ...previous,
      incidentCategory: category,
      incidentType: nextType,
      otherIncidentType: nextType === 'Other' ? previous.otherIncidentType : '',
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (hasErrors) return;
    onSubmit(values);
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <section className="card form-section">
        <h3>Reporter details</h3>
        <div className="fields two-column">
          <label>
            <span>Reporter name</span>
            <input value={values.reporterName} onChange={(e) => update('reporterName', e.target.value)} />
          </label>
          <label>
            <span>Designation</span>
            <input value={values.designation} onChange={(e) => update('designation', e.target.value)} />
          </label>
          <label>
            <span>Department</span>
            <input value={values.department} onChange={(e) => update('department', e.target.value)} />
          </label>
          <label>
            <span>Contact number</span>
            <input value={values.contact} onChange={(e) => update('contact', e.target.value)} />
          </label>
          <label>
            <span>Email</span>
            <input type="email" value={values.email} onChange={(e) => update('email', e.target.value)} />
          </label>
          <label>
            <span>Submitted by</span>
            <input value={values.submittedBy} onChange={(e) => update('submittedBy', e.target.value)} />
          </label>
        </div>
      </section>

      <section className="card form-section">
        <h3>Incident details</h3>
        <div className="fields two-column">
          <label className={fi('title')}>
            <RequiredLabel>Short title</RequiredLabel>
            <input value={values.title} onChange={(e) => update('title', e.target.value)} placeholder="Cable theft - PDC 8.P2" />
            {touched && fieldErrors.title && <span className="field-error-msg">{fieldErrors.title}</span>}
          </label>
          <label>
            <RequiredLabel>Site</RequiredLabel>
            <select value={values.site} onChange={(e) => update('site', e.target.value)}>
              {sites.map((site) => (
                <option key={site}>{site}</option>
              ))}
            </select>
          </label>
          <label>
            <RequiredLabel>Date of incident</RequiredLabel>
            <input type="date" value={values.incidentDate} onChange={(e) => update('incidentDate', e.target.value)} />
          </label>
          <label>
            <RequiredLabel>Time of incident</RequiredLabel>
            <input type="time" value={values.incidentTime} onChange={(e) => update('incidentTime', e.target.value)} />
          </label>
          <label className={fi('specificLocation')}>
            <RequiredLabel>Specific location</RequiredLabel>
            <input value={values.specificLocation} onChange={(e) => update('specificLocation', e.target.value)} />
            {touched && fieldErrors.specificLocation && <span className="field-error-msg">{fieldErrors.specificLocation}</span>}
          </label>
          <label className={fi('impactedAreaSystem')}>
            <RequiredLabel>Impacted area/system</RequiredLabel>
            <input value={values.impactedAreaSystem} onChange={(e) => update('impactedAreaSystem', e.target.value)} />
            {touched && fieldErrors.impactedAreaSystem && <span className="field-error-msg">{fieldErrors.impactedAreaSystem}</span>}
          </label>
          <label>
            <RequiredLabel>Incident category</RequiredLabel>
            <select value={values.incidentCategory} onChange={(e) => handleCategoryChange(e.target.value as IncidentCategory)}>
              {incidentCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label>
            <RequiredLabel>Incident type</RequiredLabel>
            <select value={values.incidentType} onChange={(e) => update('incidentType', e.target.value as IncidentFormValues['incidentType'])}>
              {availableTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          {showOtherType && (
            <label className={fi('otherIncidentType')}>
              <RequiredLabel>Other incident type</RequiredLabel>
              <input value={values.otherIncidentType ?? ''} onChange={(e) => update('otherIncidentType', e.target.value)} />
              {touched && fieldErrors.otherIncidentType && <span className="field-error-msg">{fieldErrors.otherIncidentType}</span>}
            </label>
          )}
          <label>
            <RequiredLabel>Severity</RequiredLabel>
            <select value={values.severity} onChange={(e) => update('severity', e.target.value as IncidentFormValues['severity'])}>
              {severities.map((severity) => (
                <option key={severity}>{severity}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Impact on operations</span>
            <select value={values.impactOnOperations} onChange={(e) => update('impactOnOperations', e.target.value as IncidentFormValues['impactOnOperations'])}>
              {impacts.map((impact) => (
                <option key={impact}>{impact}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Critical load affected</span>
            <select value={values.criticalLoadAffected ? 'Yes' : 'No'} onChange={(e) => update('criticalLoadAffected', e.target.value === 'Yes')}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </label>
          <label>
            <span>Jira ticket reference</span>
            <input value={values.jiraTicketReference} onChange={(e) => update('jiraTicketReference', e.target.value)} placeholder="FAC-1024" />
          </label>
          <label>
            <span>System restored</span>
            <select value={values.systemRestored ? 'Yes' : 'No'} onChange={(e) => update('systemRestored', e.target.value === 'Yes')}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </label>
          {values.systemRestored && (
            <label className={fi('restoredAt')}>
              <span>Date and time restored</span>
              <input type="datetime-local" value={values.restoredAt ?? ''} onChange={(e) => update('restoredAt', e.target.value)} />
              {touched && fieldErrors.restoredAt && <span className="field-error-msg">{fieldErrors.restoredAt}</span>}
            </label>
          )}
          <label className={`full-span ${fi('description')}`}>
            <RequiredLabel>Description of incident</RequiredLabel>
            <textarea rows={5} value={values.description} onChange={(e) => update('description', e.target.value)} />
            {touched && fieldErrors.description && <span className="field-error-msg">{fieldErrors.description}</span>}
          </label>
        </div>
      </section>

      <section className="card form-section">
        <h3>Immediate actions taken</h3>
        <div className="fields two-column">
          <label className="full-span">
            <span>Action taken by facilities team</span>
            <textarea rows={4} value={values.facilitiesAction} onChange={(e) => update('facilitiesAction', e.target.value)} />
          </label>
          <label className="full-span">
            <span>Action taken by vendor</span>
            <textarea rows={4} value={values.vendorAction} onChange={(e) => update('vendorAction', e.target.value)} />
          </label>
          <label className="full-span">
            <span>Mitigation applied</span>
            <textarea rows={3} value={values.mitigationApplied} onChange={(e) => update('mitigationApplied', e.target.value)} />
          </label>
        </div>
      </section>

      <section className="card form-section">
        <h3>Incident summary and root cause analysis</h3>
        <div className="fields two-column">
          <label className={fi('incidentSummary')}>
            <RequiredLabel>Incident summary</RequiredLabel>
            <textarea rows={4} value={values.incidentSummary} onChange={(e) => update('incidentSummary', e.target.value)} />
            {touched && fieldErrors.incidentSummary && <span className="field-error-msg">{fieldErrors.incidentSummary}</span>}
          </label>
          <label>
            <span>Root cause category</span>
            <select value={values.rootCauseCategory} onChange={(e) => update('rootCauseCategory', e.target.value)}>
              {rootCauseCategories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className={fi('why1')}>
            <RequiredLabel>Why 1</RequiredLabel>
            <textarea rows={3} value={values.why1} onChange={(e) => update('why1', e.target.value)} />
            {touched && fieldErrors.why1 && <span className="field-error-msg">{fieldErrors.why1}</span>}
          </label>
          <label className={fi('why2')}>
            <RequiredLabel>Why 2</RequiredLabel>
            <textarea rows={3} value={values.why2} onChange={(e) => update('why2', e.target.value)} />
            {touched && fieldErrors.why2 && <span className="field-error-msg">{fieldErrors.why2}</span>}
          </label>
          <label className={fi('why3')}>
            <RequiredLabel>Why 3</RequiredLabel>
            <textarea rows={3} value={values.why3} onChange={(e) => update('why3', e.target.value)} />
            {touched && fieldErrors.why3 && <span className="field-error-msg">{fieldErrors.why3}</span>}
          </label>
          <label className={fi('why4')}>
            <RequiredLabel>Why 4</RequiredLabel>
            <textarea rows={3} value={values.why4} onChange={(e) => update('why4', e.target.value)} />
            {touched && fieldErrors.why4 && <span className="field-error-msg">{fieldErrors.why4}</span>}
          </label>
          <label className={`full-span ${fi('why5')}`}>
            <RequiredLabel>Why 5</RequiredLabel>
            <textarea rows={3} value={values.why5} onChange={(e) => update('why5', e.target.value)} />
            {touched && fieldErrors.why5 && <span className="field-error-msg">{fieldErrors.why5}</span>}
          </label>
        </div>
      </section>

      <section className="card form-section">
        <h3>Recommendations and closure planning</h3>
        <div className="fields two-column">
          <label className={`full-span ${fi('recommendations')}`}>
            <RequiredLabel>Recommendations</RequiredLabel>
            <textarea rows={4} value={values.recommendations} onChange={(e) => update('recommendations', e.target.value)} />
            {touched && fieldErrors.recommendations && <span className="field-error-msg">{fieldErrors.recommendations}</span>}
          </label>
          <label className={`full-span ${fi('lessonsLearned')}`}>
            <RequiredLabel>Lessons learned</RequiredLabel>
            <textarea rows={4} value={values.lessonsLearned} onChange={(e) => update('lessonsLearned', e.target.value)} />
            {touched && fieldErrors.lessonsLearned && <span className="field-error-msg">{fieldErrors.lessonsLearned}</span>}
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={values.followUpRequired} onChange={(e) => update('followUpRequired', e.target.checked)} />
            <span>Follow-up action required</span>
          </label>
          <div />
          {values.followUpRequired && (
            <>
              <label>
                <span>Responsible person</span>
                <input value={values.responsiblePerson} onChange={(e) => update('responsiblePerson', e.target.value)} />
              </label>
              <label className={fi('targetCompletionDate')}>
                <RequiredLabel>Target completion date</RequiredLabel>
                <input type="date" value={values.targetCompletionDate ?? ''} onChange={(e) => update('targetCompletionDate', e.target.value)} />
                {touched && fieldErrors.targetCompletionDate && <span className="field-error-msg">{fieldErrors.targetCompletionDate}</span>}
              </label>
            </>
          )}
        </div>
      </section>

      <section className="card form-section">
        <h3>Action tracking</h3>
        <div className="fields two-column">
          <label>
            <span>Action status</span>
            <select value={values.actionStatus} onChange={(e) => update('actionStatus', e.target.value as IncidentFormValues['actionStatus'])}>
              {actionStatuses.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {touched && hasErrors && (
        <div className="validation-summary">
          <h4>Please fix the following before submitting:</h4>
          <ul>
            {Object.values(fieldErrors).map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="form-actions no-print">
        <button className="solid-button" type="submit" disabled={submitDisabled}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
