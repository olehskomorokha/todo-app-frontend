import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Auth, ApiError } from '../auth';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
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
    this.auth.register(this.form.getRawValue()).pipe(
      finalize(() => {
        this.isSubmitting = false;
        this.changeDetector.detectChanges();
      }),
    ).subscribe({
      next: () => void this.router.navigate(['/login']),
      error: (error: HttpErrorResponse) => {
        this.errorMessage = this.getErrorMessage(error);
        this.changeDetector.detectChanges();
      },
    });
  }

  private getErrorMessage(response: HttpErrorResponse): string {
    const error = response.error as Partial<ApiError> | string | null;

    if (typeof error === 'string') {
      try {
        const parsed = JSON.parse(error) as Partial<ApiError>;
        return parsed.message ?? 'Не вдалося зареєструватися. Спробуйте ще раз.';
      } catch {
        return error || 'Не вдалося зареєструватися. Спробуйте ще раз.';
      }
    }

    if (error?.message) {
      return error.message;
    }

    if (response.status === 400) {
      return 'Сервер відхилив дані реєстрації (Bad Request).';
    }

    if (response.status === 0) {
      return 'Не вдалося отримати відповідь сервера. Перевірте адресу API, HTTPS-сертифікат і CORS.';
    }

    return 'Не вдалося зареєструватися. Спробуйте ще раз.';
  }
}
