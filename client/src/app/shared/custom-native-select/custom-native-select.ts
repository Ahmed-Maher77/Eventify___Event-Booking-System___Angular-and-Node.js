import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  forwardRef,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

export interface CustomNativeSelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-custom-native-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-native-select.html',
  styleUrl: './custom-native-select.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomNativeSelectComponent),
      multi: true,
    },
  ],
})
export class CustomNativeSelectComponent implements ControlValueAccessor {
  @Input({ required: true }) options!: CustomNativeSelectOption[];
  @Input() selectId = '';
  /** Classes for the native &lt;select&gt; (layout/typography); appearance is handled by this component. */
  @Input() selectClass = '';

  protected value = '';
  protected isFocused = false;
  protected isDisabled = false;

  private onChange: (v: string) => void = () => {};
  private onTouchedCb: () => void = () => {};

  protected get mergedSelectClasses(): string {
    return [this.selectClass?.trim(), 'custom-native-select__native']
      .filter(Boolean)
      .join(' ');
  }

  writeValue(obj: string | null): void {
    this.value = obj ?? '';
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCb = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  protected onSelectChange(event: Event): void {
    const el = event.target as HTMLSelectElement;
    this.value = el.value;
    this.onChange(this.value);
  }

  protected onFocus(): void {
    this.isFocused = true;
  }

  protected onBlur(): void {
    this.isFocused = false;
    this.onTouchedCb();
  }
}
