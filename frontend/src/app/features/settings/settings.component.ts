import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { ThemeService } from '../../core/services/theme.service';
import { CalendarStatus, DaySchedule, SleepSchedule } from '../../core/models/settings.model';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const FALLBACK_TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Indiana/Indianapolis', 'America/Anchorage', 'Pacific/Honolulu',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
  'Asia/Kolkata', 'Australia/Sydney'
];

// Not in the ES2022 lib TS targets, but supported by all evergreen browsers this app ships to.
function listTimezones(): string[] {
  const intlAny = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  try {
    return intlAny.supportedValuesOf ? intlAny.supportedValuesOf('timeZone') : FALLBACK_TIMEZONES;
  } catch {
    return FALLBACK_TIMEZONES;
  }
}

function buildDayGroup(fb: FormBuilder, day: DaySchedule) {
  return fb.nonNullable.group({
    enabled: [day.enabled],
    start: [day.start],
    end: [day.end]
  });
}

type DayGroup = ReturnType<typeof buildDayGroup>;

function buildSleepGroup(fb: FormBuilder, sleep: SleepSchedule) {
  return fb.nonNullable.group({
    start: [sleep.start],
    end: [sleep.end]
  });
}

type SleepGroup = ReturnType<typeof buildSleepGroup>;

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private settingsService = inject(SettingsService);
  private themeService = inject(ThemeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly dayLabels = DAY_LABELS;
  readonly timezoneOptions = listTimezones();
  readonly scheduleForm: FormArray<DayGroup> = this.fb.array<DayGroup>([]);
  readonly sleepForm: SleepGroup = buildSleepGroup(this.fb, { start: '08:00', end: '15:00' });
  readonly timezoneControl = new FormControl('UTC', { nonNullable: true });

  calendarStatus = signal<CalendarStatus | null>(null);
  loading = signal(true);
  saving = signal(false);
  savedMessage = signal(false);
  justConnected = signal(false);

  get days(): DayGroup[] {
    return this.scheduleForm.controls;
  }

  ngOnInit(): void {
    this.themeService.setTheme('settings');
    this.load();
    this.refreshCalendarStatus();

    if (this.route.snapshot.queryParamMap.get('calendarConnected') === '1') {
      this.justConnected.set(true);
      this.router.navigate([], { queryParams: {} });
    }
  }

  load(): void {
    this.loading.set(true);
    this.settingsService.getSettings().subscribe((settings) => {
      this.scheduleForm.clear();
      settings.workSchedule.forEach((day) => this.scheduleForm.push(buildDayGroup(this.fb, day)));
      this.sleepForm.patchValue(settings.sleepSchedule);
      this.timezoneControl.setValue(settings.timezone);
      this.loading.set(false);
    });
  }

  refreshCalendarStatus(): void {
    this.settingsService.getCalendarStatus().subscribe((status) => this.calendarStatus.set(status));
  }

  save(): void {
    this.saving.set(true);
    this.settingsService
      .updateSettings(this.scheduleForm.getRawValue(), this.sleepForm.getRawValue(), this.timezoneControl.value)
      .subscribe(() => {
      this.saving.set(false);
      this.savedMessage.set(true);
      setTimeout(() => this.savedMessage.set(false), 2000);
    });
  }

  connectCalendar(): void {
    this.settingsService.getCalendarAuthUrl().subscribe(({ url }) => {
      window.location.href = url;
    });
  }

  disconnectCalendar(): void {
    this.settingsService.disconnectCalendar().subscribe(() => this.refreshCalendarStatus());
  }
}
