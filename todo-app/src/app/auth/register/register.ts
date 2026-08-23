import { Component } from '@angular/core';
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
  ) {}

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSubmitting) return;

    this.isSubmitting = true;
    this.errorMessage = '';
    this.auth.register(this.form.getRawValue()).pipe(
      finalize(() => (this.isSubmitting = false)),
    ).subscribe({
      next: () => void this.router.navigate(['/login']),
      error: error => {
        const apiError = error.error as Partial<ApiError> | string | null;
        this.errorMessage = typeof apiError === 'string'
          ? apiError
          : apiError?.message ?? 'Не вдалося зареєструватися. Спробуйте ще раз.';
      },
    });
  }
}
