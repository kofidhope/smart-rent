import ReactDatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'


export default function DatePicker({label, error, selected, onChange, minDate, maxDate, placeholderText = 'Select date', required, id,}) {
    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={id}
                    className={`label ${
                        required ? 'label-required' : ''
                    }`}
                >
                    {label}
                </label>
            )}

            <div className="relative">
                <Calendar className="absolute left-3
                              top-1/2 -translate-y-1/2
                              h-4 w-4 text-gray-400
                              pointer-events-none
                              z-10" />

                <ReactDatePicker
                    id={id}
                    selected={selected}
                    onChange={onChange}
                    minDate={minDate}
                    maxDate={maxDate}
                    placeholderText={placeholderText}
                    dateFormat="dd MMM yyyy"
                    // Prevent typing — force picker selection
                    // so date format is always consistent
                    onKeyDown={(e) => e.preventDefault()}
                    className={`
            input pl-10 w-full cursor-pointer
            ${error ? 'input-error' : ''}
          `}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-required={required}
                    wrapperClassName="w-full"
                    // Style the calendar popup
                    calendarClassName="shadow-card-active
                             border border-gray-200
                             rounded-card font-sans"
                    // Show month and year dropdowns
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    yearDropdownItemNumber={5}
                />
            </div>

            {error && (
                <p role="alert" className="error-text">
          <span className="w-1.5 h-1.5 rounded-full
                           bg-danger-icon
                           flex-shrink-0" />
                    {error}
                </p>
            )}
        </div>
    )
}