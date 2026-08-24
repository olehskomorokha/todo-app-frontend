import { ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Auth, ApiError } from '../auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  isSubmitting = false;
  errorMessage = '';

  constructor(
    private readonly auth: Auth,
    private readonly router: Router,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.auth.login(this.form.getRawValue()).pipe(
      finalize(() => {
        this.isSubmitting = false;
        this.changeDetector.detectChanges();
      }),
    ).subscribe({
      next: () => void this.router.navigateByUrl('/home'),
      error: error => {
        const apiError = error.error as Partial<ApiError> | string | null;
        this.errorMessage = this.getErrorMessage(apiError);
      },
    });
  }

  private getErrorMessage(error: Partial<ApiError> | string | null): string {
    if (typeof error === 'string') {
      try {
        const parsed = JSON.parse(error) as Partial<ApiError>;
        return parsed.message ?? 'Неправильний email або пароль.';
      } catch {
        return error || 'Неправильний email або пароль.';
      }
    }

    return error?.message ?? 'Неправильний email або пароль.';
  }
}
